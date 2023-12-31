require('dotenv').config();
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const fileapis = require('../middlewares/fileapis');
const API_URL = process.env.API_URL;
const { upload } = require('../middlewares/multer');
const moment = require('moment');

router.get('/', async (req, res, next) => {
    if (!req.session.role) {
        return res.redirect('/admin/login');
    }

    return res.render('pages/admin', {
        layout: 'admin',
        role: req.session.role,
        success: req.flash('success') || '',
        error: req.flash('error') || ''
    });
})

router.get('/login', (req ,res, next) => {
    return res.render('pages/login', {
        layout: 'main',
        success: req.flash('success') || '',
        error: req.flash('error') || ''
    });
})

router.get('/logout', (req, res, next) => {
    req.session.destroy();
    return res.redirect('/admin/login');
})

router.post('/login', async (req, res, next) => {
    const { account_ID, password } = req.body;
    
    let body = JSON.stringify({account_ID, password});
    await fetch(API_URL + 'users/login', {
        method: 'POST',
        headers: { 'Content-Type': ' application/json'},
        body: body
    })
    .then(async result => {
        result = await result.json();
        req.session.role = result.role;
        return res.redirect('/admin')
    })
})

// [GET] Storage product /admin/storage-product
router.get('/storage-product', async (req, res, next) => {
    if(req.session.role == 'staff') {
        req.flash('error', 'Bạn không đủ quyền hạn để truy cập');
        return res.redirect('/admin');
    }
    await fetch(API_URL + `products/storage` , {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
    })
    .then(async (result) => {
        result = await result.json();
        if (result.success) {
            let data = result.data;
            let products = data.map(d => {
                return {
                    pid: d.product_ID,
                    pname: d.product_name,
                    pimg: d.image_link,
                    category: d.product_category,
                    price: d.product_price,
                    priority: d.product_priority,
                    is_available: d.is_available == 1
                }
            })
    
            
            return res.render('pages/products/storage', {
                layout: 'admin',
                success: req.flash('success') || '',
                error: req.flash('error') || '' ,
                products: products
            })
        }
    }).catch(err => {
        return res.status(500).json({err});
    })
})

// [GET] Create product -> /admin/create-product
router.get('/create-product', async (req, res, next) => {
    let categories = ['buffet', 'alacarte', 'extra'];

    return res.render('pages/products/create', {
        layout: 'admin',
        pageName: 'Thêm sản phẩm',
        categories,
        success: req.flash('success') || '',
        error: req.flash('error') || ''
    })
})

// [POST] Create product -> admin/create-product
router.post('/create-product', upload.single('pimg'), async (req, res, next) => {
    const file = req.file;
    const pid = req.pid;
    let pimg = `/uploads/pimg/${pid}/${file.filename}`;

    let body = JSON.stringify({pid, pimg, ...req.body});
    await fetch(API_URL + '/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: body
    })
    .then(async (result) => {
        let data = await result.json();
        req.flash('success', 'Thêm sản phẩm thành công');
        return res.redirect('/admin/storage-product');
    })
    .catch(err => {
        req.flash('error', 'Xóa sản phẩm thất bại');
        return res.redirect('/admin/storage-product');
    })
})


// [GET] Delete product -> /admin/delete-product/:pid
router.get('/delete-product/:pid', async (req, res, next) => {
    const { pid } = req.params;
    
    await fetch(API_URL + `/products/delete/${pid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json'},
    })
    .then(async (result) => {
        let data = await result.json();

        if(data.success) {
            req.flash('success', data.msg);
            fileapis.removeDirectory(`frontend/src/public/uploads/pimg/${pid}`, err => {
                console.log(err);
            })    
        }
        else {
            req.flash('error', 'Sản phẩm có quan hệ với các bản ghi khác. Cần xóa các bản ghi đó trước khi thực hiện thao tác này.');
        }
        return res.redirect('/admin/storage-product');
    })
    .catch(err => {
        req.flash('error', 'Sản phẩm không thể xóa do câu lệnh bị lỗi');
        return res.redirect('/admin/storage-product');
    })
})

// [GET] Update product -> admin/update-product/:pid
router.get('/update-product/:pid', async (req, res, next) => {
    const { pid } = req.params;
    let categories = ['buffet', 'alacarte', 'extra'];
    let data = await fetch(API_URL + `/products/get-one/${pid}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(async result => {
        result = await result.json();
        if (result.success) {
            let data = result.data;
            return {
                pid: data.product_ID,
                pname: data.product_name,
                pimg: data.image_link,
                category: data.product_category,
                price: data.product_price,
                priority: data.product_priority,
                is_available: data.is_available == 1
            };
        }    
    })

    return res.render('pages/products/update', {
        layout: 'admin',
        pageName: 'Chỉnh sửa sản phẩm',
        categories, data,
        success: req.flash('success') || '',
        error: req.flash('error') || ''
    })
})

// [POST] Update product -> /admin/update-product/:pid
router.post('/update-product/:pid', upload.single('pimg'), async (req, res, next) => {
    const { pid } = req.params;
    const file = req.file;
    let { oldpath } = req.body;
    let pimg = '';
    
    if(file) {
        pimg = `/uploads/pimg/${pid}/${file.filename}`;
        if(oldpath) {
            fileapis.deleteSync('frontend/src/public' + oldpath, err => [
                console.log(err)
            ])
        } 
    }
    else {
        pimg = oldpath;
    }

    let body = JSON.stringify({
        pid, pimg, ...req.body
    })
    
    await fetch(API_URL + `/products/update/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: body
    })
    .then(async result => {
        let data = await result.json();
        if(data.success) {
            req.flash('success', 'Chỉnh sửa sản phẩm thành công');
        }else {
            req.flash('error', 'Chỉnh sửa sản phẩm thất bại');
        }
        return res.redirect('/admin/storage-product');
        
    })
    .catch(err => {
        req.flash('error', 'Chỉnh sửa sản phẩm thất bại');
        return res.redirect('/admin/storage-product');
    })
})

// [GET] Preview product -> /admin/preview-product/:pid
router.get('/preview-product/:pid', async (req, res, next) => {
    const { pid } = req.params;

    await fetch(API_URL + `/products/get-one/${pid}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(async result => {
        result = await result.json();

        if (result.success) {
            let data = result.data;
            return res.render('pages/products/preview', {
                layout: 'admin',
                pageName: 'Preview sản phẩm',
                data: {
                    pid: data.product_ID,
                    pname: data.product_name,
                    pimg: data.image_link,
                    category: data.product_category,
                    price: data.product_price,
                    priority: data.product_priority,
                },
                success: req.flash('success') || '',
                error: req.flash('error') || ''
            })
        }
        
    })
    .catch(err => {
        req.flash('error', 'Không tìm thấy thông tin sản phẩm này');
        return res.redirect('/admin/storage-product');
    })
})

// [PUT] Switch Status of product -> /admin/status-product/:pid/:is_available
router.get('/status-product/:pid/:is_available', async (req, res, next) => {
    
    const { pid, is_available } = req.params;

    let body = JSON.stringify({is_available});
    await fetch(API_URL + `/products/switch-status/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json'},
        body: body
    })
    .then(async result => {
        result = await result.json();
        
        // return res.redirect('/admin/storage-product');
        return res.sendStatus(200);
    })
    .catch(err => {
        // return res.redirect('/admin/storage-product');
        return res.sendStatus(500);
    })
})

// [GET] Preview Staff -> /admin/preview-staff/:uid
router.get('/preview-staff/:uid', async (req, res, next) => {
    const { uid } = req.params;

    await fetch(API_URL + `/users/getUser/${uid}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json'}
    })
    .then(async result => {
        result = await result.json();
        let data = {};
        if(result.success) {
            data = result.data;  
        }

        return res.render('pages/staffs/preview', {
            layout: 'admin',
            pageName: 'Thông tin nhân viên',
            data: {
                uid: data.staff_ID,
                username: data.staff_name,
                join_date: new Date(data.join_date).toLocaleString('vi-vn'),
                role: data.roles,
                uimg: data.image_link
            }
        })
    })
    .catch(err => {
        req.flash('error', 'Không tìm thấy thông tin nhân viên này');
        return res.redirect('/admin/list-staffs');
    })
})

// [GET] List all the staffs -> /admin/list-staffs
router.get('/list-staffs', async (req, res, next) => {
    if(req.session.role != 'manager') {
        req.flash('error', 'Bạn không đủ quyền hạn để truy cập');
        return res.redirect('/admin');
    }

    await fetch(API_URL + '/users/getUsers', {
        method: 'GET', 
        headers: {'Content-Type': 'application/json'}
    })
    .then(async result => {
        result = await result.json();
        let data = []
        if(result.success) {
            data = result.data.map(user => {
                return {
                    uid: user.staff_ID,
                    username: user.staff_name,
                    join_date: new Date(user.join_date).toLocaleString('vi-vn'),
                    role: user.roles,
                    uimg: user.image_link,
                    is_available: user.is_available
                }
            });
        }

        return res.render('pages/staffs/list', {
            layout: 'admin',
            pageName: 'Danh sách nhân viên',
            data: data
        })
    })
    .catch(err => {
        req.flash('error', 'Không tìm thấy nhân viên nào');
        return res.redirect('/admin');
    })
})

// [GET] Switch status a staff -> /admin/status-staff/:pid/:is_available
router.get('/status-staff/:uid/:is_available', async (req, res, next) => {
    const { uid, is_available } = req.params;

    let body = JSON.stringify({is_available});
    await fetch(API_URL + `/users/switch-status/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json'},
        body: body
    })
    .then(async result => {
        result = await result.json();
        
        return res.redirect('/admin/list-staffs');
    })
    .catch(err => {
        return res.redirect('/admin/list-staffs');
    })
})

router.get('/revenue', async (req, res, next) => {
    if(req.session.role != 'manager') {
        req.flash('error', 'Bạn không đủ quyền hạn để truy cập');
        return res.redirect('/admin');
    }

    let { date, shift } = req.query;
    if (!date) 
        date = moment(new Date()).format("YYYY-MM-DD");
    let key = (shift) ? `?date=${date}&shift=${shift}` : `?date=${date}`;
    
    await fetch(API_URL + `/bills/get-bills-of-day${key}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json'}
    })
    .then(async result => {
        result = await result.json();
        
        if(result.success) {
            let data = result.data;
            
            bills = [];
            if(data.length != 0) {
                bills = data.map(d => {
                    return {
                        bill_ID: d.bill_ID,
                        created_at: moment(d.created_at).format('YYYY-MM-DD HH:mm:ss'),
                        table_ID: d.table_ID,
                        staff_ID: d.staff_ID,
                        total_price: d.total_price,
                        is_completed: (d.is_completed) ? `<p style="color: rgb(100, 226, 145) ">Hoàn thành</p>` : `<p style="color: crimson ">Chưa thanh toán</p>`
                    }
                });
            }
            // return res.json(result)
            return res.render('pages/revenue/list', {
                layout: 'admin',
                bills
            });
        }
        
        return res.render('pages/revenue/list', {
            layout: 'admin',
            
        });
        
    })
})

module.exports = router;