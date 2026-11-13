const express=require('express');
const bodyParser=require("body-parser");
const path=require('path');
const homeRouter=require('./router/homeRouter');
const app=express();

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs')
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname,'public')));
app.use('/',homeRouter);

// Vercel imports the app; locally we start the server.
if(require.main===module){
    const port=process.env.PORT || 8080;
    app.listen(port,()=>console.log('listening on '+port));
}
module.exports=app;
