const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Schema } = mongoose; // Destructure Schema from mongoose
const lodash = require("lodash"); // For string manipulation
const env = require('dotenv').config();

const app = express();
app.set("view engine", "ejs"); // Set EJS
app.use(
    bodyParser.urlencoded({
        // Set defaults properties to get user data
        extended: true,
    })
);
app.use(express.static("public")); // Allow node access static file

const itemSchema = new Schema({
    // Schema when using mongoose
    name: String,
});
const listSchema = new Schema({
    name: String,
    items: [itemSchema],
});
const toDos = mongoose.model("ToDo", itemSchema);
const list = mongoose.model("List", listSchema);

// Connection string
mongoose.connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.uvrr1.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
);

app.get("/", function (req, res) {
   // Home dir when user entered
    toDos.find({}, (err, toDo) => {
        // Get all the data in db
        if (err) {
            console.log(err);
        } else {
            // Rendered when no error
            res.render("list", {
                listTitle: "Today",
                newListItems: toDo,
            });
        }
    });
});
app.post("/", async function (req, res) {

    const item = req.body.newItem;
    const currentList = req.body.list;

    if (item) {
        const itemss = new toDos({
            name: item,
        });
        if (currentList === "Today") {
            await itemss.save(); // Insert the data
            // Insert only if user type in something
            res.redirect("/"); // Redirect to refresh the page
        } else {
            list.findOne(
                { name: currentList },
                async function (err, foundedList) {
                    if (!err) {
                        await foundedList.items.push(itemss);
                        await foundedList.save();
                        res.redirect(`/${currentList}`);
                    }
                }
            );
        }
    } else {
        if (currentList === "Today") {
            res.redirect("/");
        } else {
            res.redirect(`/${currentList}`);
        }
    }
});

app.post("/checkBox", (req, res) => {
    // When user selected the check box and delete
    const deleteItem = req.body.deleteItem; // Get id
    const currentList = req.body.currentList; // Get current list

    if (currentList === "Today") {
        toDos.deleteOne({ _id: deleteItem }, (err, result) => {
            // Trigger delete and log error if any
            if (err) {
                console.log(err); //Log the error
            } else {
                console.log(result.deletedCount);
                res.redirect("/");
            }
        });
    } else {
        list.findOneAndUpdate({ 
                name: currentList 
            }, 
            {
                $pull: { 
                    items: {
                        _id: deleteItem
                    } 
                } 
            }, (err, result) => {
                // If there its no error redirect 
                if (!err) {
                    res.redirect(`/${currentList}`);
                }
        });

    }
});

app.get("/:category", (req, res) => {
    const request = lodash.capitalize(req.params.category);

    list.findOne({ name: request }, (err, result) => {
        if (!err && !result) {
            const lists = new list({
                name: request,
                items: [],
            });

            lists.save();

            res.redirect(`/${request}`);
        } else {
            res.render("list", {
                listTitle: result.name,
                newListItems: result.items,
            });
        }
    });
});


app.listen(3000, function () {
    console.log("Server started on port 3000");
});
