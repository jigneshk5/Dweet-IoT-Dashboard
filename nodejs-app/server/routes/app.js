const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var request = require('request-promise');
var dweetClient = require("node-dweetio");
var dweetio = new dweetClient();

router.get('/', (req, res) => {
    res.redirect('/login');
});

router.get('/register', (req, res) => {
    res.render('register',{
        message: ''
    }); 
});
router.get('/login', (req, res) => {
    res.render('login',{
        message: ''
    }); 
});
router.post('/login', (req, res) => {
    User.findOne({email: req.body.email}).exec()
    .then(user=> {
        //console.log(user);
        bcrypt.compare(req.body.password,user.password, (err,result)=>{
            if(err){
                console.log(err);
            }
            if(result){   //If comparasion is successful
            const token = jwt.sign({
                    email: user.email,
                    userId: user._id
                },'test secret',{expiresIn:'3h'});
                // Set session expiration to 3 hr.
                    const expiresIn = 60 * 60* 3 * 1000;
                    const options = {maxAge: expiresIn, httpOnly: true};
                    res.cookie('token', token, options);

                res.redirect('/dashboard/'+user._id); 
            }
            else{
                res.render('login',{
                    message: 'password do not match'
                }); 
            }
        })
    })
    .catch(err=>{
        res.render('login',{
            message: err.message
        }); 
    })
});

router.post('/register', (req, res) => {
    User.find({email: req.body.email}).exec()
    .then(user=> {
        //console.log(user);
        if(user.length >=1){
            return res.render('register',{
                message: 'User Already Exists'
            });
        }
        else{
            let password= req.body.password;
            let confirm_password= req.body.confirm_password;
            if(password===confirm_password){
                bcrypt.hash(req.body.password,10, (err,hash)=>{   //Salt size is 10
                    if(err){
                        return res.render('register',{
                            message: err
                        }); 
                    }else{
                        const user= new User({
                            email: req.body.email,
                            password: hash
                        });
                        user.save().then(result =>{
                            console.log(result);
                            res.render('login',{
                                message: 'Login with same credentials'
                            }); 
                        })
                        .catch(err =>{
                            res.render('register',{
                                message: err.message
                            }); 
                            console.log(err);
                        })
                    }
                });
            }
        }
    })
    .catch(err=>{
        res.render('register',{
            message: err.message
        }); 
    })
});

router.get('/dashboard/:userId', isLoggedIn, (req, res) => {   //Protecting this route with IsLoggedIn Middleware
    const id= req.params.userId;
    //console.log(req.query.token);
    User.findById(id).exec().then(user=>{
        // dweetio.dweet_for("nodemcu123", {redled:user.widgets.toggle_red, greenled:user.widgets.toggle_green, slider: user.widgets.slider }, function(err, dweet){
        //     if(err) 
        //         console.log('Dweet error: '+err);
        //     else
        //     console.log(dweet.content); // The content of the dweet     
        // });
        var options = {
            method: 'POST',
            uri: 'https://dweet.io/dweet/for/nodemcu_init',
            body: {
                redled: user.widgets.toggle_red,
                greenled: user.widgets.toggle_green,
                slider:user.widgets.slider,
                ldr:user.widgets.gauge,
                dist:{
                    first: { value: user.widgets.line_chart.first.value, when: user.widgets.line_chart.first.when},
                    second: { value: user.widgets.line_chart.second.value, when: user.widgets.line_chart.second.when},
                    third: { value: user.widgets.line_chart.third.value, when: user.widgets.line_chart.third.when},
                    fourth: { value: user.widgets.line_chart.fourth.value, when: user.widgets.line_chart.fourth.when},
                    fifth: { value: user.widgets.line_chart.fifth.value, when: user.widgets.line_chart.fifth.when}
                }
            },
            json: true
        };
         
        request(options)                          //SENDING LAST VALUE STORED IN DATABASE TO DWEET API to Display
        .then(function (dweet) {
            console.log("DWEETED");
        })
        .catch(function (err) {
            console.log("DWEET Error "+err);
        });

        let dist=[];
        dweetio.listen_for(id+"_nodemcu_dynamic", function(dweet){
            // This will be called anytime there is a new dweet for nodemcu_dynamic
            let arr=[];

            let d= dist.length;
            if(dweet.content.dist){
                if(dist.length<5){
                    if(dist.length==0){
                        arr.push({value: dweet.content.dist, when: dweet.created});       //[123,234]  
                    }  
                    else{
                        while(d>0){
                            arr.push({ value: dist[dist.length-d].value, when: dist[dist.length-d].when});
                            d--; 
                        }
                        arr.push({value: dweet.content.dist, when: dweet.created});       //[123,234]
                    }     
                    dist.push({value: dweet.content.dist, when: dweet.created});           
                    //dist.unshift(dweet.content.dist);   //[234,null,null,null,null]  //[234,null,null,null,null]
                    for(let i=0;i<5-dist.length;i++){
                        arr.push({value: null, when:null});
                    }
                }
                else{
                    dist.pop();
                    dist = [{value: dweet.content.dist, when: dweet.created}].concat(dist);
                    arr=dist;
                }
            }
            else{
                for(let i=0;i<5;i++){
                    arr.push({value: null, when:null});
                }
            }
            //console.log(arr);
            let up={
                'widgets.gauge' : dweet.content.ldr,
                'widgets.line_chart.first.value': arr[0].value,
                'widgets.line_chart.second.value': arr[1].value,
                'widgets.line_chart.third.value': arr[2].value,
                'widgets.line_chart.fourth.value': arr[3].value,
                'widgets.line_chart.fifth.value': arr[4].value,
                'widgets.line_chart.first.when': arr[0].when,
                'widgets.line_chart.second.when': arr[1].when,
                'widgets.line_chart.third.when': arr[2].when,
                'widgets.line_chart.fourth.when': arr[3].when,
                'widgets.line_chart.fifth.when': arr[4].when
            }
            for (const prop in up) {
                if(up[prop]==null){
                    delete up[prop];
                }
              }
            //console.log(up);
            User.updateOne({_id: id},{$set: up},function (err,doc) {
                if (err)
                    console.log(err); // saved!
             });
            console.log(dweet);
        });

        // dweetio.listen_for(id+"_nodemcu_static", function(dweet){
        //     // This will be called anytime there is a new dweet for nodemcu_dynamic

        //     let up={
        //         'widgets.toggle_red' : dweet.content.redled,
        //         'widgets.toggle_green': dweet.content.greenled, 
        //         'widgets.slider': dweet.content.slider
        //     }
        //     for (const prop in up) {
        //         if(up[prop]==null){
        //             delete up[prop];
        //         }
        //       }
        //     //console.log(up);
        //     User.updateOne({_id: id},{$set: up},function (err,doc) {
        //         if (err)
        //             console.log(err); // saved!
        //      });
        // });

        res.render('dashboard',{
            uid: user._id,
            creationTime: user.registerAt,
            email: user.email
        }); 
    })
    .catch(function(err) {
        console.log(err);
    });
});

router.get('/logout', function(req, res) {
    res.clearCookie('token');
    dweetio.stop_listening();
    res.redirect('/login');
});

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {   //To verify an incoming token from client
    try{
        //console.log(req.headers);
        jwt.verify(req.cookies.token, 'test secret');  
        return next();
    }
    catch(err){
        return res.status(401).render('login',{  //401 Unauthorized Accesss
            message: 'Token expired or tampered'
        });  
    }
}


module.exports = router;