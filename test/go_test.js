'use strict';

const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const lab = (exports.lab = Lab.script());

const {scriptToBulkStatements} = require('../index.js');

lab.experiment('ssis script', function () {
    lab.test('splits on GO keyword', () => {
        const script = `
            ALTER TABLE users ADD CreatedBy VARCHAR(100)
            GO
            UPDATE users SET name='Test user' WHERE id=1
            GO`;
        const expected = [
            `ALTER TABLE users ADD CreatedBy VARCHAR(100)`,
            `UPDATE users SET name='Test user' WHERE id=1`,
        ]
        Code.expect(scriptToBulkStatements(script)).to.equal(expected);
    });

    lab.test('splits on case-insensitive GO keyword', () => {
        const script = `
            ALTER TABLE users ADD CreatedBy VARCHAR(100)
            Go
            UPDATE users SET name='Test user' WHERE id=1
            go`;
        const expected = [
            `ALTER TABLE users ADD CreatedBy VARCHAR(100)`,
            `UPDATE users SET name='Test user' WHERE id=1`,
        ]
        Code.expect(scriptToBulkStatements(script)).to.equal(expected);
    });
});
