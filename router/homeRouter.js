const express=require('express');
const Router=express.Router();
const {query}=require('../db');

const COLOURS=['red','orange','yellow','green','cyan','blue','purple','pink','brown'];

// The stored password is "char:colour" pairs, e.g. "a:red" "B:none".
// Summarise it without ever exposing the characters themselves.
function summarise(encoded){
    // Match the exact colour names: a bare [a-z]+ would swallow a following lowercase character.
    const pairs=String(encoded||'').match(new RegExp('.:(?:none|'+COLOURS.join('|')+')','gs'))||[];
    const chars=pairs.map(p=>p[0]);
    const colours=pairs.map(p=>p.slice(2));
    const pw=chars.join('');
    let pool=0;
    if(/[a-z]/.test(pw)) pool+=26;
    if(/[A-Z]/.test(pw)) pool+=26;
    if(/\d/.test(pw)) pool+=10;
    if(/[^A-Za-z\d]/.test(pw)) pool+=10;
    pool=pool||1;
    const coloured=colours.filter(c=>COLOURS.includes(c));
    const base=pw.length*Math.log2(pool);
    const bonus=coloured.length*Math.log2(COLOURS.length);
    const total=base+bonus;
    const counts={};
    coloured.forEach(c=>{counts[c]=(counts[c]||0)+1;});
    let rating='Weak';
    if(total>=65) rating='Excellent'; else if(total>=45) rating='Good'; else if(total>=28) rating='Fair';
    return {
        length:pw.length,
        colours:colours.map(c=>COLOURS.includes(c)?c:'none'),
        colouredCount:coloured.length,
        distinct:Object.keys(counts).length,
        counts,
        base:Math.round(base),
        bonus:Math.round(bonus),
        total:Math.round(total),
        rating
    };
}

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
        res.render('land',{name:userName,email,pw:summarise(pswd)});
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
        const r=await query('SELECT userName,email,pswd FROM users WHERE email=?',[email]);
        if(!r.rows.length) return res.status(401).render('register',{tab:'login',error:'No account found for that email.'});
        const user=r.rows[0];
        if(pswd==user.pswd){
            res.render('dashboard',{name:user.userName,email:user.email,pw:summarise(user.pswd)});
        }else{
            res.status(401).render('register',{tab:'login',error:'Wrong password. Colours count too: colour the same characters the same way you did at sign up.'});
        }
    }catch(e){
        res.status(500).render('register',{tab:'login',error:'Could not reach the database. Please try again.'});
    }
})

module.exports=Router;
