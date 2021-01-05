var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productSchema = new Schema({
   store:String,
   product:String,
   url:String,
   stock:Boolean
});

module.exports = mongoose.model('productColls', productSchema);  