'use strict';

const port = 3000
const request = require('request');
var bot = require("./telegram");

const DB = require("./database/index");
DB();

const Product = require("./Article");
const express = require('express')
const app = express();

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
var bodyParser = require('body-parser')

// parse application/x-www-form-urlencoded
var bodyParser = require('body-parser');
const Article = require('./Article');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

var interval = setInterval(function () { }, 1000);




app.get('/productos', function (req, res) {
    res.render('form.html');
});


// POST method route
app.post('/newProduct', function (req, res) {

    var product = req.body.product;
    var url = req.body.url;
    var store = req.body.store;

    var product = new Product({ product: product, url: url, store: store, stock: false });

    product.save(function (err) {
        if (err) return err;
        // saved!
    });
});



app.listen(port, () => {
    console.log("Node JS Server...")
    main();
    interval = setInterval(main, 900000)
});

function allProductsAvailables() {
    return new Promise(function (resolve, reject) {

        Product.find({ stock: false }).exec(function (err, data) {
            if (data.length == 0)
                resolve(true)
            else
                reject("There are products in the database that are not in stock")
        })
    });


}


function main() {

    Product.
        find({ stock: false }).exec(function (err, data) {
            data
                .forEach((articleEach, index, array) => {

                    isAvailable(articleEach).then(article => {

                        article.stock = true;
                        data.splice(index, 1);
                        bot.sendMessage("<chatId>", `El producto ${article.product} está disponible en ${article.store}. \n URL: ${article.url}`);
                        Product.updateMany({ _id: articleEach._id }, { $set: { stock: true } }).then();

                        sleep(5000);


                    }).catch(err => {
                        console.log(err);
                    });

                });

        });

    allProductsAvailables().then(d => {
        clearInterval(interval)
    }).catch(err => {
        console.log("Todavía quedan productos que no están disponibles en PCcom y Amazon")
    })

}


function isAvailable(article) {

    return new Promise((resolve, reject) => {
        request(article.url, {
            timeout: 3000
        }, (error, response, body) => {

            if (!error) {

                if (article.store == "Pccomponentes") {

                    if (body.includes("Avísame"))
                        reject(false)
                    else {
                        resolve(article);
                    }

                } else {
                    //Amazon
                    if (body.includes("Temporalmente sin stock"))
                        reject(false)
                    else {
                        resolve(article);
                    }
                }
            }
        });
    })
}

function sleep(time) {
    var stop = new Date().getTime();
    while (new Date().getTime() < stop + time) {
        ;
    }
}