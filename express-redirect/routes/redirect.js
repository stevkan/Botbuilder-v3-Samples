var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.redirect('https://www.bing.com');
    if (res.statusCode === 404) {
        res.render('redirect', { title: '302 Redirect' });
    }
    console.log(res.statusCode);
});

module.exports = router;
