var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productSchema = new Schema({
   store:String,
   product:String,
   url:String,

   markSale: Boolean,
   stock:Boolean,

   price: String,
   actualPrice: String,
   
   priceAlert: Boolean,
   stockAlert: Boolean
});

module.exports = mongoose.model('productColls', productSchema);  