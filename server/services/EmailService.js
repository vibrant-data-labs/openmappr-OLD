'use strict';
var _            = require('lodash'),
    Promise      = require("bluebird"),
    fs           = require('fs'),
    nodemailer   = require('nodemailer'),
    sgMail       = require('@sendgrid/mail');
var config = require("./AppConfig").get();

var supportTransport = nodemailer.createTransport('SMTP', config.email);

function sendFromSupport(to, sub, templateName, htmlData) {
    var logPrefix = '[EmailService: ] ';
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    console.log(logPrefix + 'sending email');

    var templatePath = "./client/src/templates/email_templates/" + templateName + ".html",
        templateContent = fs.readFileSync(templatePath, "utf8"),
        compiledFn = _.template(templateContent),
        html = compiledFn(htmlData);

    var mailOptions = {
        from: "Vibrant Data <admin@vibrantdata.io>",//"support@vibrantdata.is>", //"admn@mappr.io",
        to: to,
        subject: sub,
        html: html
    };

    return new Promise(function(resolve, reject) {
        supportTransport.sendMail(mailOptions, function(err, response) {
            if (err) {
                console.error(logPrefix + 'could not sent email', err);
                reject('Mail unsuccessful!');
            }
            else {
                console.log(logPrefix + 'email sent to ' + to);
                resolve('Mail sent!');
            }
        });
    });
}

function sendSupportEmail(req, res) {
    var logPrefix = '[EmailService: ] ';
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    console.log(logPrefix + 'sending email');
    return new Promise((resolve, reject) => {
        console.log(process.env.EMAIL_TO)
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        var msg = {
            to: process.env.EMAIL_TO,
            from: process.env.EMAIL_FROM,
            subject: 'New Support Message',
            text: req.body.message,
            html: req.body.message,
        };
        sgMail.send(msg, (error, info) =>
            error ? reject(error) : resolve(info)
        )
      res.end()
    })
}


module.exports = {
    sendFromSupport: sendFromSupport,
    sendSupportEmail: sendSupportEmail
};
