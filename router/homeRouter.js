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
            res.status(409).render('register',{tab:'signup',error:'That username or email is already registered.'});
        }else{
            res.status(500).render('register',{tab:'signup',error:'Could not reach the database. Please try again.'});
        }
    }
})

//log in
Router.post('/login',async(req,res)=>{
    try{
        const {email,pswd}=req.body;
        const r=await query('SELECT userName,pswd FROM users WHERE email=?',[email]);
        if(!r.rows.length) return res.status(401).render('register',{tab:'login',error:'No account found for that email.'});
        const user=r.rows[0];
        if(pswd==user.pswd){
            res.render('dashboard',{name:user.userName});
        }else{
            res.status(401).render('register',{tab:'login',error:'Wrong password. Colours count too: colour the same characters the same way you did at sign up.'});
        }
    }catch(e){
        res.status(500).render('register',{tab:'login',error:'Could not reach the database. Please try again.'});
    }
})

module.exports=Router;
