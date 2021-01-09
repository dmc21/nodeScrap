'use strict';

const dotenv = require('dotenv');
dotenv.config();

const cheerio = require('cheerio');

const port = 3000
const request = require('request');
var bot = require("./telegram");

const DB = require("./database/index");
DB();

const Product = require("./Article");
const express = require('express')
const app = express();

app.set('views', __dirname + '/');
app.use('/js', express.static('js'))

app.engine('html', require('ejs').renderFile);
var bodyParser = require('body-parser')

const cors = require("cors");
app.use(cors());

// parse application/x-www-form-urlencoded
var bodyParser = require('body-parser');
const Article = require('./Article');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

var interval = setInterval(function () { }, 1000);


app.get('/', (req, res) => {
    res.render('views/allproducts.html');
});

app.get('/getAll', (req, res) => {

    Product.find({}).then(data => {
        res.send(data);
    })
})


// POST method route
app.post('/newProduct', function (req, res) {

    var product = req.body.product;
    var url = req.body.url;
    var store = req.body.store;
    var price = req.body.price;

    var stockAlert = req.body.stockAlert;
    var priceAlert = req.body.priceAlert;

    var product =
        new Product({
            product: product,
            url: url,
            store: store,
            stock: false,
            price: price,
            actualPrice: "Not Available",
            markSale: false,
            priceAlert: priceAlert,
            stockAlert: stockAlert
        });

    product.save(function (err) {
        if (err) return err;
        // saved!
    });
});

app.post("/deleteProduct", (req, res) => {
    var id = req.body._id;

    Product.deleteOne({ _id: id }).then(data => {
        res.send(data);
    })
})

app.post("/productValues", (req, res) => {
    const url = req.body.url;

    request(url, {

    }, (error, response, body) => {
        if (!error) {
            try {
                const $ = cheerio.load(body)
                if (url.includes("pccomponentes")) {

                    const name = $("h1.h4 strong").text()
                    const actualPrice = $("div#precio-main").attr("data-price")

                    res.send({ name: name, price: actualPrice, store: "Pccomponentes" })
                } else {
                    // lo mismo con amazon

                    const name = $("#productTitle").text();
                    const actualPrice = $("#price_inside_buybox").text()

                    res.send({ name: name, price: actualPrice, store: "Amazon" })
                }
            } catch (e) {
                res.send({ name: "No disponible", price: 0.0, store: "--" })
            }
        }
    });
})



app.listen(port, () => {
    console.log("Node JS Server...")
    main();
    interval = setInterval(main, 300000)
});

function allProductsAvailables() {
    return new Promise(function (resolve, reject) {

        Product.find({ stock: false, markSale: false }).exec(function (err, data) {
            if (data.length == 0)
                resolve(true)
            else
                reject("There are products in the database that are not in stock")
        })
    });


}


function main() {

    Product.
        find({ $and: [{ stock: false, markSale: false }] }).exec(function (err, data) {
            data
                .forEach((articleEach, index, array) => {

                    isAvailable(articleEach).then(article => {

                        let msg = ""

                        if (article.priceAlert && article.stockAlert)
                            msg = `El producto ${article.product} está disponible en ${article.store} por el precio que DESEABAS!!!\n --> ${article.actualPrice}€.\n ${article.url}`
                        else if (article.priceAlert) {
                            msg = `El producto ${article.product} ha bajado al precio que DESEABAS!!!\n --> ${article.actualPrice}€.\n ${article.url}`
                        } else if (article.stock)
                            msg = `El producto ${article.product} está disponible en ${article.store}\n --> ${article.actualPrice}€.\n ${article.url}`



                        data.splice(index, 1);
                        bot.sendMessage(process.env.CHAT_ID, msg);
                        article.save().then();
                        sleep(5000);


                    }).catch(articleNotAvailable => {
                        articleNotAvailable.save().then()
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
                    checkProduct(article, body, "Avísame", resolve, reject);
                } else {
                    checkProduct(article, body, "Temporalmente sin stock", resolve, reject);
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

function checkProduct(article, body, text, resolve, reject) {
    const $ = cheerio.load(body)

    if(article.store == "Pccomponentes")
        article.actualPrice = $("div#precio-main").attr("data-price")
    else
        article.actualPrice = $("#price_inside_buybox").text()

    const articleInStock = !body.includes(text);
    const twoAlertsActive = article.stockAlert == true && article.priceAlert == true;

    if (twoAlertsActive) {
        if (articleInStock && parseFloat(article.actualPrice) <= parseFloat(article.price)) {
            article.stock = true;
            article.markSale = true;
            resolve(article)
        } else {
            reject(article)
        }
    } else {

        if (article.stockAlert) {
            if (articleInStock) {
                article.stock = true
                revolve(article)
            } else {
                reject(article)
            }

        } else if (article.priceAlert) {
            if (parseFloat(article.actualPrice) <= parseFloat(article.price)) {
                article.markSale = true
                resolve(article)
            } else {
                reject(article)
            }
        }
    }
}