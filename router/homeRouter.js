const express=require('express');
const Router=express.Router();
const crypto=require('crypto');
const nodemailer=require('nodemailer');
const {query}=require('../db');

Router.get('/',(req,res)=>{
    res.render('register',{b2b:'hello1'});
})
Router.get('/homepage',(req,res)=>{
    res.render('register');
})
Router.get('/forgot',(req,res)=>{
    res.render('forgot');
})
Router.get('/home',(req,res)=>{
    res.render('register');
})
Router.get('/reset',async(req,res)=>{
    try{
        const r=await query('SELECT email FROM users WHERE resetToken=? AND resetExpires>?',[req.query.token||'',Date.now()]);
        if(!r.rows.length) return res.send('reset link is invalid or expired');
        res.render('reset',{userEmail:r.rows[0].email,token:req.query.token});
    }catch(e){
        res.send('cannot connect');
    }
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

//forgot password
Router.post('/forgot',async(req,res)=>{
    try{
        const email=req.body.email;
        const r=await query('SELECT id FROM users WHERE email=?',[email]);
        if(!r.rows.length) return res.send("This email has not been registered");

        const token=crypto.randomBytes(24).toString('hex');
        await query('UPDATE users SET resetToken=?,resetExpires=? WHERE email=?',[token,Date.now()+3600*1000,email]);

        const base=process.env.BASE_URL||`${req.protocol}://${req.get('host')}`;
        const transporter=nodemailer.createTransport({
            service:'gmail',
            auth:{user:process.env.MAIL_USER,pass:process.env.MAIL_PASS}
        });
        await transporter.sendMail({
            from:process.env.MAIL_USER,
            to:email,
            subject:'Reset your password',
            html:`<a href='${base}/reset?token=${token}'>click here</a>`
        });
        res.send('check your mail');
    }catch(e){
        console.log(e);
        res.send('could not send mail');
    }
})

Router.post('/reset',async(req,res)=>{
    try{
        const {password,token}=req.body;
        const r=await query('UPDATE users SET pswd=?,resetToken=NULL,resetExpires=NULL WHERE resetToken=? AND resetExpires>?',[password,token||'',Date.now()]);
        if(!r.rowsAffected) return res.send({"Success":"Reset link is invalid or expired!"});
        res.render('resetSuccess',{link:"register.ejs"});
    }catch(e){
        res.send('cannot connect');
    }
})

module.exports=Router;
