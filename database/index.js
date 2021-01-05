const mongoose = require('mongoose');

module.exports = () => {
    mongoose.connect("mongodb://localhost/products")
        .then(() => {
            console.log(`Mongo connected on localhost:27017 `)
        }).catch((err) =>{
           console.log(`Connection Error: ${err}`)
    })

    process.on('SIGINT', () => {
        mongoose.connection.close(() => {
            console.log(`Mongo is disconnected`);
            process.exit(0).then(r => console.log(`Close Process`));
        });
    });
}