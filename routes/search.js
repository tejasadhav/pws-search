const express = require('express');
const http = require('http');
const https = require('https');
const natural = require('natural');
const stopword = require('stopword');
const router = express.Router();


let User = require('../models/user');
let WebLog = require('../models/weblog');
let Query = require('../models/query');
var query;
var page;

router.get('/searching',ensureAuthenticated, function(req, response){
    query = req.query.q;
    page = req.query.page;
    var profession = req.user.profession;
    //console.log(page);
    console.log(query);

    if(query!=undefined){
      var oldString = query.split(' ')
      var newStemQuery = stopword.removeStopwords(oldString);
      console.log(newStemQuery);
      var newQuery;
      var sendQuery;
      var wordQuery = [];
      for(var i=0;i<newStemQuery.length;i++){
        wordQuery.push(newStemQuery[i]);
      }
      sendQuery = newStemQuery.join(" ");
      if(newStemQuery.length==1){
        newQuery = newStemQuery.splice(0);
      }
      else if(newStemQuery.length==2){
        newQuery = newStemQuery.join("&topics=");
      }
      else if(newStemQuery.length==3){
        newQuery = newStemQuery.splice(0,3).join("&topics=");
        console.log(newQuery);
        //newQuery = newQuery+"&topics="+newStemQuery[0];
      }
      else{
        newQuery = query;
      }
      var url1 = "https://api.datamuse.com/words?rel_trg="+newQuery+"&topics="+profession;
      https.get(url1, function(res1){
        var body1 = '';
        var words = [];

        res1.on('data', function(chunk){
            body1 += chunk;





        });

        res1.on('end', function(){
            var suggres = JSON.parse(body1);
            if(suggres.length>0){
              if(suggres.length>10){
                for(var i=0;i<10;i++ ){
                  words.push(suggres[i].word);
                }
              }
              else{
                for(var i=0;i<suggres.length;i++ ){
                  words.push(suggres[i].word);
                }
              }
            }
            else{
              words = "";
            }
            var url ="https://www.googleapis.com/customsearch/v1?&q=" + query +"&gl=in&cx=000925433967744971763:lyw-keup9fs&key=AIzaSyDVjFCflTDx8IGkiDp_WGZuarJ6gkwUiRk";
            if(page==2){
              var url ="https://www.googleapis.com/customsearch/v1?&q=" + query +"&gl=in&start=11&cx=004254893213773670373:1ibjy-kyfvu&key=AIzaSyBno0e-gTcb_1ikxCQrnvvv9Q9DDoPpjOo";
            }
            if(page==3){
              var url ="https://www.googleapis.com/customsearch/v1?&q=" + query +"&gl=in&start=21&cx=004254893213773670373:1ibjy-kyfvu&key=AIzaSyBno0e-gTcb_1ikxCQrnvvv9Q9DDoPpjOo";
            }
            https.get(url, function(res){
                var body = '';

                res.on('data', function(chunk){
                    body += chunk;
                });

                res.on('end', function(){
                    var googleres = JSON.parse(body);
                    var resquery=query;
                    var userid = req.user._id;
                    let condition = {'query': resquery, user:userid}
                    Query.findOneAndUpdate(condition, {$inc: {count:1}}, function(err,data){
                      if(err){
                        console.log(err);
                      }
                      else{
                        if(!data){
                          let newQuery = new Query();
                          newQuery.query = resquery;
                          newQuery.user = userid;
                          newQuery.save(function(er){
                            if(er){
                              console.log(er);
                            }
                          });
                        }
                    }
                  });
                  WebLog.find({user:req.user._id,$text : {$search : query}},{score : {$meta: "textScore"}}).sort({count:-1}).sort({score : {$meta: "textScore"}}).limit(4).exec(function(err,dbresults){
                    if(err){
                      console.log(err);
                    }
                    var newresult = {items:[]};
                    for(var i=0;i<googleres.items.length;i++){
                      newresult.items.push({
                        "title": googleres.items[i].title,
                        "url": googleres.items[i].link,
                        "snippet": googleres.items[i].snippet
                      });
                    }
                    var flag=0;
                    if(dbresults.length!=0){
                      for(var i=0;i<dbresults.length;i++){
                        for(var j=0;j<newresult.items.length;j++){
                        //console.log(newresult.items[j].title);
                          var str = dbresults[i].title;
                          if(newresult.items[j].title === str.trim()){
                            flag=1;
                            //console.log(flag);
                            break;
                          }
                          else{
                            flag=0;
                          }
                        }
                       // console.log(flag);
                        if(flag==0){
                          newresult.items.push({
                            "title": dbresults[i].title,
                            "url": dbresults[i].url,
                            "snippet": dbresults[i].snippet
                          });
                        }
                      }
                    }
                   //console.log(newresult);
                    var jsonArr=[];
                    for(var i=0;i<newresult.items.length;i++){
                      var itemTitle = newresult.items[i].title;
                      var itemSnippet = newresult.items[i].snippet;
                      var finalResult = itemTitle+" "+itemSnippet;
                      jsonArr.push(finalResult);
                    }
                    var TfIdf = natural.TfIdf;
                    var tfidf = new TfIdf();
                    for(var i=0;i<jsonArr.length;i++){
                      tfidf.addDocument(jsonArr[i]);
                    }
                    var words2=[];
                    for(var i=0;i<words.length;i++){
                      words2.push(words[i]);
                    }
                    for(var i=0;i<wordQuery.length;i++){
                      words2.push(wordQuery[i]);
                    }
                    console.log(words2);
                    var tfidfValue = [];
                    tfidf.tfidfs(words2, function(i, measure) {
                      tfidfValue.push(measure);
                    });
                    console.log(tfidfValue);
                    var recoResults=[];
                    for(var i=0;i<tfidfValue.length;i++){
                      recoResults.push(i);
                    }
                   //console.log(recoResults);
                    var len = tfidfValue.length;
                    var stop;
                    for (var i=0; i < len; i++)  {
                      for (var j=0,stop=len-i; j < stop; j++) {
                          if (tfidfValue[j-1] < tfidfValue[j]) {
                              var temp = tfidfValue[j];
                              var temp2 = recoResults[j];
                              tfidfValue[j] = tfidfValue[j-1];
                              recoResults[j] = recoResults[j-1];
                              tfidfValue[j-1] = temp;
                              recoResults[j-1] = temp2;
                          } // end if
                      }
                    } // end for
                    console.log(tfidfValue.length);
                    console.log(recoResults);
                    response.render('search',{
                      words : words,
                      query : query,
                      recoResults : recoResults,
                      sendQuery: sendQuery,
                      dbresults : dbresults,
                      newresult : newresult.items,
                      googleresult : googleres.items
                    });
                  });
                });
            }).on('error', function(e){
                  console.log("Got an error: ", e);
            });
          });
        }).on('error', function(e){
          console.log("Got an error: ", e);
        });
      }
      else{
        response.render('search',{
          query:"",
          googleresult : "",
          dbresults: ""
        });
      }

});


router.get('/save', ensureAuthenticated, function(req,res){
    var title = req.query.title;
    var url = req.query.url;
    var snippet = req.query.snippet;
    var id = req.user._id;
    console.log(title, url,snippet,id);
    let condition = {'title': title, 'url': url, user:id}
    WebLog.findOneAndUpdate(condition, {$inc: {count:1}}, function(err,data){
      if(err){
        console.log(err);
      }
      else{
        if(!data){
          let newWebLog = new WebLog();
          newWebLog.query = query;
          newWebLog.title = title;
          newWebLog.url = url;
          newWebLog.snippet = snippet;
          newWebLog.user = id;
          newWebLog.save(function(er){
            if(er){
              console.log(er);
            }
          });
        }
     }
  });
});



router.get('/search_member',ensureAuthenticated,function(req,res){
  var regex = new RegExp(req.query['term'], 'i');
  var query = Query.find({user:req.user._id, query: regex}, { 'query': 1 }).sort({"count":-1
}).limit(20);
     // Execute query in a callback and return users list
  query.exec(function(err, users) {
     if (!err) {
        // Method to construct the json result set
        var result = [];
        for(var object in users){
          result.push(users[object]);
        }
        res.send(result, {
           'Content-Type': 'application/json'
        }, 200);
     } else {
        res.send(JSON.stringify(err), {
           'Content-Type': 'application/json'
        }, 404);
     }
  });
});

router.get('/suggested',ensureAuthenticated,function(req,response){
  var url = "https://api.datamuse.com/words?rel_trg=apple"
  https.get(url, function(res){
    var body = '';
    var words = [];

    res.on('data', function(chunk){
        body += chunk;
    });

    res.on('end', function(){
        var suggres = JSON.parse(body);
        for(var i=0;i<10;i++ ){
          words.push(suggres[i].word);
        }
        console.log(words);
        response.send(words, {
          'Content-Type': 'application/json'
       }, 200);
    });
  }).on('error', function(e){
    console.log("Got an error: ", e);
  });
});

function ensureAuthenticated(req ,res ,next){
  if(req.isAuthenticated()){
    return next();
  }else{
    req.flash("danger","Please Login");
    res.redirect("/users/login");
  }
}

module.exports = router
