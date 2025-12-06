"""add triggers and stored procedures for occupancy and metrics

Revision ID: 20251205_triggers_and_procs
Revises: e2cd0e1d90ad
Create Date: 2025-12-05 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251205_triggers_and_procs'
down_revision = 'e2cd0e1d90ad'
branch_labels = None
depend_on = None


def upgrade():
    # Create BEFORE trigger that handles diagnosis change (remove ward on diagnosis change)
    op.execute("""
    CREATE OR REPLACE FUNCTION fn_patients_before_update_handle_diagnosis()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF TG_OP = 'UPDATE' AND NEW.diagnosis_id IS DISTINCT FROM OLD.diagnosis_id THEN
        -- remove patient from ward when diagnosis changes
        NEW.ward_id := NULL;
      END IF;
      RETURN NEW;
    END;
    $$;
    """)

    # Create BEFORE trigger to validate ward capacity on INSERT/UPDATE
    op.execute("""
    CREATE OR REPLACE FUNCTION fn_patients_before_capacity_check()
    RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE
      cap_ok BOOLEAN;
    BEGIN
      -- Only check when assigning a ward (INSERT or when ward_id changes on UPDATE)
      IF (TG_OP = 'INSERT' AND NEW.ward_id IS NOT NULL) OR
         (TG_OP = 'UPDATE' AND NEW.ward_id IS DISTINCT FROM OLD.ward_id AND NEW.ward_id IS NOT NULL) THEN
        SELECT (current_occupancy < max_capacity) INTO cap_ok FROM wards WHERE id = NEW.ward_id;
        IF NOT cap_ok THEN
          RAISE EXCEPTION 'Ward % is full', NEW.ward_id;
        END IF;
      END IF;
      RETURN NEW;
    END;
    $$;
    """)

    # Create BEFORE trigger to enforce diagnosis consistency (prevent mixed diagnoses in ward)
    op.execute("""
    CREATE OR REPLACE FUNCTION fn_patients_before_check_ward_diagnosis()
    RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE
      ward_has_patients BOOLEAN;
      ward_diagnosis INT;
    BEGIN
      -- Only check when assigning a ward (INSERT or when ward_id changes on UPDATE)
      IF (TG_OP = 'INSERT' AND NEW.ward_id IS NOT NULL) OR
         (TG_OP = 'UPDATE' AND NEW.ward_id IS DISTINCT FROM OLD.ward_id AND NEW.ward_id IS NOT NULL) THEN
        -- Check if ward already has patients
        SELECT EXISTS(SELECT 1 FROM patients WHERE ward_id = NEW.ward_id LIMIT 1)
        INTO ward_has_patients;
        
        IF ward_has_patients THEN
          -- Get the diagnosis of existing patients in the ward
          SELECT DISTINCT diagnosis_id INTO ward_diagnosis
          FROM patients 
          WHERE ward_id = NEW.ward_id AND ward_id IS NOT NULL;
          
          -- Ensure new patient has the same diagnosis
          IF ward_diagnosis IS NOT NULL AND ward_diagnosis != NEW.diagnosis_id THEN
            RAISE EXCEPTION 'Ward % already contains patients with different diagnosis (diagnosis_id=%)', 
                           NEW.ward_id, ward_diagnosis;
          END IF;
        END IF;
      END IF;
      RETURN NEW;
    END;
    $$;
    """)

    # Create AFTER trigger to maintain ward occupancy counters on INSERT/UPDATE/DELETE
    op.execute("""
    CREATE OR REPLACE FUNCTION fn_patients_after_maintain_occupancy()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        IF NEW.ward_id IS NOT NULL THEN
          UPDATE wards SET current_occupancy = current_occupancy + 1 WHERE id = NEW.ward_id;
        END IF;
        RETURN NEW;
      ELSIF TG_OP = 'DELETE' THEN
        IF OLD.ward_id IS NOT NULL THEN
          UPDATE wards SET current_occupancy = GREATEST(0, current_occupancy - 1) WHERE id = OLD.ward_id;
        END IF;
        RETURN OLD;
      ELSIF TG_OP = 'UPDATE' THEN
        -- ward changed
        IF OLD.ward_id IS NOT NULL AND OLD.ward_id IS DISTINCT FROM NEW.ward_id THEN
          UPDATE wards SET current_occupancy = GREATEST(0, current_occupancy - 1) WHERE id = OLD.ward_id;
        END IF;
        IF NEW.ward_id IS NOT NULL AND OLD.ward_id IS DISTINCT FROM NEW.ward_id THEN
          UPDATE wards SET current_occupancy = current_occupancy + 1 WHERE id = NEW.ward_id;
        END IF;
        RETURN NEW;
      END IF;
      RETURN NULL;
    END;
    $$;
    """)

    # Create BEFORE trigger for ward deletion - move patients to compatible wards
    op.execute("""
    CREATE OR REPLACE FUNCTION fn_wards_before_delete_move_patients()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    DECLARE
        diag_id INT;
        patient RECORD;
        target RECORD;
        needed INT;
        remaining INT;
        total_free INT := 0;
    BEGIN
        -- Get diagnosis from patients in the ward being deleted
        SELECT diagnosis_id INTO diag_id
        FROM patients
        WHERE ward_id = OLD.id
        LIMIT 1;

        -- Count patients that need to be relocated
        SELECT COUNT(*) INTO needed FROM patients WHERE ward_id = OLD.id;    
        remaining := needed;

        -- If ward has no patients, delete it
        IF needed = 0 THEN
            RETURN OLD;
        END IF;

        -- Calculate total free capacity in compatible wards
        -- (wards with same diagnosis or empty wards)
        SELECT COALESCE(SUM(w.max_capacity - COALESCE(p.cnt, 0)), 0)
        INTO total_free
        FROM wards w
        LEFT JOIN (
            SELECT ward_id, COUNT(*) AS cnt FROM patients GROUP BY ward_id
        ) p ON p.ward_id = w.id
        WHERE w.id <> OLD.id
          AND (
                EXISTS (
                    SELECT 1 
                    FROM patients pp 
                    WHERE pp.ward_id = w.id 
                      AND pp.diagnosis_id = diag_id
                )
                OR NOT EXISTS (
                    SELECT 1 
                    FROM patients pp 
                    WHERE pp.ward_id = w.id
                )
              );

        -- Check if there's enough capacity
        IF total_free < needed THEN
            RAISE EXCEPTION 
                'Not enough free beds to move patients from ward "%" (needed: %, available: %)', 
                OLD.name, needed, total_free;
        END IF;

        -- Process candidate wards, starting with most spacious ones
        FOR target IN
            SELECT 
                w.id, 
                (w.max_capacity - COALESCE(p.cnt, 0)) AS free
            FROM wards w
            LEFT JOIN (
                SELECT ward_id, COUNT(*) AS cnt 
                FROM patients 
                GROUP BY ward_id
            ) p ON p.ward_id = w.id
            WHERE w.id <> OLD.id
              AND (
                    EXISTS (
                        SELECT 1 
                        FROM patients pp 
                        WHERE pp.ward_id = w.id 
                          AND pp.diagnosis_id = diag_id
                    )
                    OR NOT EXISTS (
                        SELECT 1 
                        FROM patients pp 
                        WHERE pp.ward_id = w.id
                    )
                  )
              AND (w.max_capacity - COALESCE(p.cnt, 0)) > 0
            ORDER BY free DESC
        LOOP
            -- Move patients to current ward while it has capacity
            FOR patient IN
                SELECT id 
                FROM patients 
                WHERE ward_id = OLD.id 
                LIMIT target.free
            LOOP
                UPDATE patients 
                SET ward_id = target.id 
                WHERE id = patient.id;
                
                remaining := remaining - 1;
                EXIT WHEN remaining = 0;
            END LOOP;

            EXIT WHEN remaining = 0;
        END LOOP;

        -- Sanity check: all patients should be moved
        IF remaining > 0 THEN
            RAISE EXCEPTION 
                'Distribution error: % patients could not be placed. Deletion cancelled.', 
                remaining;
        END IF;

        RETURN OLD;
    END;
    $$;
    """)

    # Attach trigger to wards table
    op.execute("""
    DROP TRIGGER IF EXISTS tr_wards_before_delete ON wards;
    CREATE TRIGGER tr_wards_before_delete
        BEFORE DELETE ON wards
        FOR EACH ROW
        EXECUTE FUNCTION fn_wards_before_delete_move_patients();
    """)

    # Attach triggers to patients table
    op.execute("""
    DROP TRIGGER IF EXISTS tr_patients_before_diagnosis ON patients;
    CREATE TRIGGER tr_patients_before_diagnosis
      BEFORE UPDATE OF diagnosis_id ON patients
      FOR EACH ROW
      EXECUTE FUNCTION fn_patients_before_update_handle_diagnosis();
    """)

    op.execute("""
    DROP TRIGGER IF EXISTS tr_patients_before_capacity ON patients;
    CREATE TRIGGER tr_patients_before_capacity
      BEFORE INSERT OR UPDATE ON patients
      FOR EACH ROW
      EXECUTE FUNCTION fn_patients_before_capacity_check();
    """)

    op.execute("""
    DROP TRIGGER IF EXISTS tr_patients_before_diagnosis_consistency ON patients;
    CREATE TRIGGER tr_patients_before_diagnosis_consistency
      BEFORE INSERT OR UPDATE ON patients
      FOR EACH ROW
      EXECUTE FUNCTION fn_patients_before_check_ward_diagnosis();
    """)

    op.execute("""
    DROP TRIGGER IF EXISTS tr_patients_after_occupancy ON patients;
    CREATE TRIGGER tr_patients_after_occupancy
      AFTER INSERT OR UPDATE OR DELETE ON patients
      FOR EACH ROW
      EXECUTE FUNCTION fn_patients_after_maintain_occupancy();
    """)

    # Stored procedures / functions for metrics used on client
    op.execute("""
    CREATE OR REPLACE FUNCTION sp_get_ward_occupancy_percent(p_ward_id INT)
    RETURNS INT LANGUAGE plpgsql AS $$
    DECLARE
      occ INT;
      cap INT;
      pct INT;
    BEGIN
      SELECT current_occupancy, max_capacity INTO occ, cap FROM wards WHERE id = p_ward_id;
      IF occ IS NULL OR cap IS NULL OR cap = 0 THEN
        RETURN 0;
      END IF;
      pct := (occ * 100) / cap;
      RETURN pct;
    END;
    $$;
    """)

    op.execute("""
    CREATE OR REPLACE FUNCTION sp_get_total_patients()
    RETURNS INT LANGUAGE sql AS $$
      SELECT COUNT(*) FROM patients;
    $$;
    """)

    op.execute("""
    CREATE OR REPLACE FUNCTION sp_get_unassigned_patients_count()
    RETURNS INT LANGUAGE sql AS $$
      SELECT COUNT(*) FROM patients WHERE ward_id IS NULL;
    $$;
    """)

    op.execute("""
    CREATE OR REPLACE FUNCTION sp_get_patient_count_by_diagnosis()
    RETURNS TABLE(diagnosis_id INT, cnt INT) LANGUAGE sql AS $$
      SELECT diagnosis_id, COUNT(*) FROM patients GROUP BY diagnosis_id;
    $$;
    """)


def downgrade():
    # Drop triggers and functions
    op.execute("""
    DROP TRIGGER IF EXISTS tr_patients_after_occupancy ON patients;
    DROP TRIGGER IF EXISTS tr_patients_before_diagnosis_consistency ON patients;
    DROP TRIGGER IF EXISTS tr_patients_before_capacity ON patients;
    DROP TRIGGER IF EXISTS tr_patients_before_diagnosis ON patients;
    DROP TRIGGER IF EXISTS tr_wards_before_delete ON wards;
    """)

    op.execute("""
    DROP FUNCTION IF EXISTS fn_patients_after_maintain_occupancy();
    DROP FUNCTION IF EXISTS fn_patients_before_check_ward_diagnosis();
    DROP FUNCTION IF EXISTS fn_patients_before_capacity_check();
    DROP FUNCTION IF EXISTS fn_patients_before_update_handle_diagnosis();
    DROP FUNCTION IF EXISTS fn_wards_before_delete_move_patients();
    """)

    op.execute("""
    DROP FUNCTION IF EXISTS sp_get_ward_occupancy_percent(INT);
    DROP FUNCTION IF EXISTS sp_get_total_patients();
    DROP FUNCTION IF EXISTS sp_get_unassigned_patients_count();
    DROP FUNCTION IF EXISTS sp_get_patient_count_by_diagnosis();
    """)
