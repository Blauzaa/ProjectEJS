    const mongoose = require('mongoose');
    const connect = mongoose.connect('mongodb://localhost:27017/Login');

    //check database connect atau gk
    connect.then(() => {
        console.log('Database connected Successfully');
    })
    .catch(() =>{
        console.log('Database cannot be connected');
    });

    const loginSchema = new mongoose.Schema({ //membuat schema baru
        name:{
            type: String,
            required: true
        },
        password:{
            type: String,
            required: true
        }
        
    });

    const collection = new mongoose.model('users', loginSchema);//membuat collection baru

    module.exports = collection;  //export ke controller untuk dipakai


