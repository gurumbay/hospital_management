module.exports = {
  hospital: {
    input: {
      target: 'http://localhost:8000/openapi.json', // or './openapi.json'
    },
    output: {
      target: './src/api/generated.ts',
      client: 'axios',
      clean: true,
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
};