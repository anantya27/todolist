const express= require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _ = require("lodash");
// const date=require(__dirname+"/date.js");

const app=express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));

// Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
// by default, you need to set it to false.
mongoose.set('useFindAndModify', false);

mongoose.connect("mongodb+srv://admin-anantya:Test123@cluster0.jebuq.mongodb.net/todolistDB",{useNewUrlParser:true, useUnifiedTopology: true});
// mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema ={
  name: String
};
const Item=mongoose.model("Item",itemsSchema);

const item1= new Item({
  name:"Welcome to your todolist!"
});

const item2= new Item({
  name:"Hit the + button to add a new item."
});

const item3= new Item({
  name:"<-- Hit this to delete the item."
});

const defaultItems=[item1,item2,item3];

const listSchema ={
  name: String,
  items: [itemsSchema]
};
const List=mongoose.model("list",listSchema);


app.get("/",function(req,res){

  Item.find({},function(err,foundItems){

    if(foundItems.length==0){
      Item.insertMany(defaultItems,function(err){
        if(err)
          console.log(err);
        else
          console.log("succesfully saved default items");
      });
      res.redirect("/");
    }
    else{
      // let day=date.getDate();
      res.render("list",{
        listTitle:"Today",
        newListItems:foundItems
      });
    }

  });
})

app.get("/:customListName",function(req,res){
  const customListName=_.capitalize(req.params.customListName);


  if(customListName==="Favicon.ico")
    res.redirect("/")
  else{
    List.findOne({name:customListName},function(err,foundList){
      if(!err){
        if(foundList){
          res.render("list",{
            listTitle:customListName,
            newListItems:foundList.items
          });
        }
        else{
          if(customListName!=="Favicon.ico"){
            const list=new List({
              name:customListName,
              items:defaultItems
            });
            list.save();
            res.redirect("/"+customListName);
          }

        }
      }

    });
  }
});

app.post("/",function(req,res){
  const itemName=req.body.newItem;
  const listName = req.body.list;

  const item=new Item({
    name:itemName
  });

  if(listName=="Today"){
   item.save();
   res.redirect("/");
  }else{
   List.findOne({name:listName},function(err,foundList){
     foundList.items.push(item);
     foundList.save();
     res.redirect("/"+listName);
   });
 }


});

app.post("/delete",function(req,res){
  const checkedItemId=req.body.checkbox;
  const listName=req.body.listName;

  if(listName=="Today"){
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(!err){
        console.log("Successfully deleted the checked Item.");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name:listName},{$pull: {items: {_id:checkedItemId}}},function(err,foundList){
      if(!err){
        res.redirect("/"+ listName);
      }
    })
  }

});

let port =process.env.PORT;
if(port==null || port==""){
  port=3000;
}

app.listen(port,function(){
  console.log("Server has started succesfully");
})
