const express = require('express');
const ejs = require('ejs');
const path = require('path');
const bcrypt = require('bcrypt');
const collection = require('./config');
const { name } = require('ejs');
const { error } = require('console');
const app = express();
//mengubah data menjadi format json
app.use(express.json());

app.use(express.urlencoded({extended: false})); //melakukan parsing data

const port = 3000;

//ejs
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index');
    });

app.get('/buy', (req, res) => {
    res.render('buy');
    });

app.get('/comingsoon', (req, res) => {
    res.render('comingsoon');
    });

app.get('/login', (req, res) => {
    res.render('login');
    });

app.get('/signin', (req, res) => {
    res.render('signin');
    });

app.get('/watch', (req, res) => {
    res.render('watch');
    });

//Register
app.post('/signin', async (req, res) => {
    const data = {
        name: req.body.username,
        password: req.body.password,
        confirmpassword: req.body.confirmpassword
    }
    const existingUser = await collection.findOne({name: data.name});
    if(existingUser && data.password !== data.confirmpassword){

        res.send('Password and confirm password not match and User already exists');
    } else if(data.password !== data.confirmpassword){
        res.send('Password and confirm password not match');
    }else if(existingUser){
        res.send('User already exists');
    } else{
        //hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword;//password yang diinputkan akan diubah menjadi hashed password
        const userdata = await collection.insertMany(data);
        console.log(userdata);
        res.render('login');
    }
});




//Login
app.post('/login', async (req, res) => {
    try{
        const check = await collection.findOne({name: req.body.username});
        if(!check){
            res.send('User not found');
        }
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (isPasswordMatch) {
            res.render('index');
        }else{
            res.send('Invalid Password');
        }
    }catch{
        res.send('wrong details');
    }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});