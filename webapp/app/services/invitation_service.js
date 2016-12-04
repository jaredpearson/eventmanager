'use strict';

const db = require('../db');
const q = require('q');
const moment = require('moment-timezone');

function convertInvitationDataToModel(row) {
    if (typeof row === 'undefined') {
        return row;
    }
    return {
        id: row.invitation_id,
        code: row.code,
        created: moment.tz(row.created, 'Etc/GMT+0'),
        used: row.used,
        createdById: row.created_by
    };
}

function loadUnusedInviteFromDb(inviteCode) {
    return db.query(`SELECT 
        invitation_id,
        code,
        created,
        used,
        created_by
        FROM Invitations
        WHERE
        code = $1::TEXT AND
        used = false
        LIMIT 1`, [inviteCode])
        .then((result) => {
            if (result.rowCount > 0) {
                return result.rows[0];
            } else {
                return undefined;
            }
        })
        .then(convertInvitationDataToModel)
}

function insertInviteInDb(code, createdBy) {
    return db.query(`INSERT INTO Invitations
        (code, created_by)
        VALUES
        ($1::TEXT, $2::INTEGER)
        RETURNING invitation_id, code, created, used, created_by`,
        [code, createdBy])
        .then((result) => {
            if (result.rowCount > 0) {
                return result.rows[0];
            } else {
                return undefined;
            }
        })
        .then(convertInvitationDataToModel);
}

const INVITE_CODE_LENGTH = 10;
// The invite code will contain
// 0..9 - during generation, this will be 0..9
// A..Z - during generation, 10..35
// a..z - during generation, 36..61
const INVITE_CODE_SPACE = (10 + 26 + 26);
function generateInviteCode() {
    let code = '';
    while (code.length < INVITE_CODE_LENGTH) {
        const selected = Math.floor(Math.random() * INVITE_CODE_SPACE);

        if (selected >= 0 && selected <= 9) { // 0..9
            code += String.fromCharCode(selected + 48);

        } else if (selected >= 10 && selected <= 35) { // A..Z
            code += String.fromCharCode(selected - 10 + 65);

        } else if (selected >= 36 && selected <= 61) { // a..z
            code += String.fromCharCode(selected - 36 + 97);
        }
    }
    return code;
}

module.exports = {
    /**
     * Generates a new invite code in the DB
     * @param {String} userId the ID of the user that is generating the new invite code
     */
    create(userId) {
        const inviteCode = generateInviteCode();
        return insertInviteInDb(inviteCode, userId);
    },

    /**
     * Uses the invite code so that it can't be used again.
     */
    useCode(code) {
        return db.query('UPDATE Invitations SET used = true WHERE code=$1::TEXT',[code])
            .then(() => true);
    },

    /**
     * Verifies the invite code to see if it's valid and unused.
     * @param {String} code the invite code to be validated
     * @returns {{valid:boolean}|{valid:boolean, code:String, reason:String}} the result of checking
     * if the invite code is valid
     */
    validate(code) {
        if (!code || code === '' || code.trim().length === 0) {
            return q({
                code: 'INVITE_CODE_REQUIRED',
                reason: 'An invite code is required.',
                valid: false
            });
        }

        // verify that the invite code is a real invite code
        return loadUnusedInviteFromDb(code)
            .then((invite) => {
                if (invite) {
                    return {
                        valid: true
                    };
                } else {
                    return undefined;
                }
            });
    }
};