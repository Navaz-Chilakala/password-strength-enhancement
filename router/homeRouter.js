const express=require('express');
const Router=express.Router();
const {query}=require('../db');

Router.get('/',(req,res)=>{
    res.render('register',{b2b:'hello1'});
})
Router.get('/homepage',(req,res)=>{
    res.render('register');
})
Router.get('/home',(req,res)=>{
    res.render('register');
})
Router.post('/register',async(req,res)=>{
    try{
        const {userName,email,pswd}=req.body;
        await query('INSERT INTO users (userName,email,pswd) VALUES (?,?,?)',[userName,email,pswd]);
        res.render('land',{link:"register.ejs"});
    }catch(error){
        if(/UNIQUE/i.test(String(error.message))){
            res.send("username or email already exists");
        }else{
            res.send("cannot connect");
        }
    }
})

//log in
Router.post('/login',async(req,res)=>{
    try{
        const {email,pswd}=req.body;
        const r=await query('SELECT userName,pswd FROM users WHERE email=?',[email]);
        if(!r.rows.length) return res.send("enter correct email");
        const user=r.rows[0];
        if(pswd==user.pswd){
            res.render('dashboard',{name:user.userName});
        }else{
            res.send('enter correct password');
        }
    }catch(e){
        res.send("cannot connect");
    }
})

module.exports=Router;
