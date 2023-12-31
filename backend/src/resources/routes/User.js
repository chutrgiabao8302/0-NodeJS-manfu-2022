// là account
const router = require('express').Router();
const db = require("../../config/db/database");
const { queryString } = require('../middlewares');
const { uuid } = require('uuidv4');
const bcrypt = require('bcryptjs');

router.get('/', (req, res, next) => {
    // console.log(bcrypt.hashSync('9952811', 10))
    return res.json({result: 'pass'});
})

// Get a User -> /api/users/getUser/:uid
router.get('/getUser/:uid', async (req, res, next) => {
    const { uid } = req.params;

    await db.Query(queryString('select', {
        select: '*',
        table: '__STAFF',
        where: `staff_ID = '${uid}'`
    }))
    .then(records => {
        if(records.length != 0) {
            return res.status(200).json({success: true, data: records[0]})
        }
        return res.status(404).json({success: false, msg: 'Không tim thấy nhân viên nào'});
    })
    .catch(err => {
        return res.status(500).json({success: false, err});
    })
    
})

// GET User List -> /api/users/getUsers
router.get('/getUsers', async (req, res, next) => {
    await db.Query(queryString('select', {
        select: '*',
        table: '__STAFF',
        optional: 'ORDER BY join_date'
    }))
    .then(records => {
        if(records.length != 0) {
            return res.status(200).json({success: true, data: records})
        }
        return res.status(404).json({success: false, msg: 'Không tìm thấy nhân viên nào'});
    })
    .catch(err => {
        return res.status(500).json({success: false, err});
    })
})

// [POST] Login account -> /api/users/login
router.post('/login', async (req, res, next) => {
    const { account_ID, password } = req.body;
    
    await db.Query(queryString('select', {
        select: '*',
        table: '__ACCOUNT',
        where: `account_ID = '${account_ID}'`
    }))
    .then(async records => {   
        if(records.length != 0) {
            // return bcrypt.compare(password, records[0].password)
            //     .then(result => {
            //         if(result)
            //             return res.status(200).json({success: true, data: {uid: records[0].staff_ID, role: records[0].roles}})
            //         return res.status(300).json({success: false, msg: 'Mật khẩu không chính xác'});
            //     })
            
            if (records[0].account_password == password) {
                let key = records[0].account_ID.slice(0,2);
                let role = 'staff';
                switch(key) {
                    case 'KC':
                        role = 'chef' ;
                        break;
                    case 'MN':
                        role = 'manager';
                        break;
                    default:
                        break;
                }
                return res.status(200).json({success: true, role: role})
            }

            return res.status(300).json({success: false, msg: 'Mật khẩu không chính xác'});
        }
        return res.status(404).json({success: false, msg: 'Tài khoản không tồn tại'})
    })
        
    .catch(err => {
        return res.status(500).json({success: false, err})
    })
})

// [POST] Sign up an account for Staff -> api/users/register
router.post('/register', async (req, res, next) => {
    const { username, dob, email, phone, role , password } = req.body;

    await db.Query(queryString('select', {
        select: '*',
        table: '__STAFF',
        where: `staff_phone = '${phone}'`
    }))
    .then(async records => {
        if(records.length != 0) {
            return res.status(300).json({success: false, msg: 'Nhân viên này đã tồn tại'});
        }

        let uid = 'NV' + uuid().substring(0,8);
        let hash = bcrypt.hashSync(password, 10);
        await db.Execute(queryString('insert', {
            table: '__STAFF',
            values: `'${uid}', '${username}', '${dob}', '${email}', '${phone}', GETDATE(), '${role}', '${hash}'`
            // id, name, dob, email, phone, join_date, role, password
        }))
        .then(() => {
            return res.status(200).json({success: true, msg: 'Đăng ký tài khoản thành công'});
        })
        .catch(err => {
            return res.status(500).json({success:false, err})
        })
    })
    .catch(err => {
        return res.status(500).json({success:false, err})
    })
})

// [PUT] Toggle switch status of Staff -> /api/users/switch-status/:uid 
router.put('/switch-status/:uid', async (req, res, next) => {
    const { uid } = req.params;
    const { is_available } = req.body;
    
    let available = (is_available == "true") ? 0 : 1;

    await db.ExecProc({
        procedure: `PROC_SWITCH_STATUS_STAFF '${uid}', ${available}`
    })
    .then(() => {
        return res.status(200).json({success: true, msg: 'Chỉnh sửa trạng thái thành công'});
    })
    .catch(err => {
        return res.status(500).json({success: false, err});
    })
})

// []

module.exports = router;