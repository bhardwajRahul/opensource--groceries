export const en_translations = 
{
    "general": {
        "friends": "Friends",
        "conflict_log": "Conflict Log",
        "groceries_menu": "Groceries Menu",
        "lists": "Lists",
        "create_new_list": "Create New List",
        "manage_all_listgroups": "Manage All Listgroups",
        "other_actions": "Other Actions",
        "manage_categories": "Manage Categories",
        "manage_all_items": "Manage All Items",
        "view_global_items": "View Global Items",
        "settings": "Settings",
        "edit": "Edit",
        "editing": "Editing",
        "active": "Active",
        "completed": "Completed",
        "stocked_here": "Stocked Here",
        "category": "Category",
        "uncategorized": "Uncategorized",
        "quantity": "Quantity",
        "uom_abbrev": "UoM",  // Unit of Measure Abbreviation
        "no_uom": "No UoM", // No specified unit of measure
        "times": "times",
        "reset": "Reset",
        "note": "Note",
        "cancel": "Cancel",
        "save": "Save",
        "add": "Add",
        "delete": "Delete",
        "name": "Name",
        "color": "Color",
        "needs_confirmed": "Needs Confirmed",
        "requested": "Requested",
        "confirmed": "Confirmed",
        "needs_registering": "Needs Registering",
        "take_picture_for_item":"Take a picture for your item",
        "loading_all_items": "Loading All Items...",
        "all_items": "All Items",
        "loading_categories": "Loading Categories...",
        "categories": "Categories",
        "loading_category": "Loading Category...",
        "items_using_category_one": "There is {{count}} item using this category.",
        "items_using_category_other": "There are {{count}} items using this category",
        "lists_using_category_one": "There is {{count}} list using this category.",
        "lists_using_category_other": "There are {{count}} lists using this category.",
        "delete_this_list": "Delete This List?",
        "really_delete_list": "Do you really want to delete this list?",
        "all_list_info_lost": "All information on this list will be lost.",
        "editing_category": "Editing Category: ",
        "loading_conflict_info": "Loading Conflict Information...",
        "conflict_item": "Conflict Item",
        "from": "from",
        "main_differences": "Main Differences",
        "winner": "Winner",
        "losers": "Losers",
        "return": "Return",
        "loading_conflict_log": "Loading Conflict Log...",
        "set_as_viewed": "Set As Viewed",
        "loading_friends": "Loading Friends...",
        "email_sent": "An email has been sent to {{email}} to confirm and create their account. The URL is here: {{url}} . This has also been copied to the clipboard.",
        "url": "URL",
        "confirm": "Confirm",
        "prompt_register_friend": "There is no user with email {{email}} currently registered. Do you want to ask them to register?",
        "adding_friend": "Adding a new Friend",
        "email_address_friend": "E-Mail address for friend to add",
        "user_not_found_send_registration": "User not found, send registration request?",
        "send_registration": "Send Registration",
        "url_registration_confirmation": "URL for Registration Confirmation",
        "ok": "OK",
        "loading_global_item":"Loading Global Item...",
        "undefined": "Undefined",
        "viewing_global_item": "Viewing Global Item",
        "new_placeholder": "<NEW>",
        "default_category": "Default Category",
        "default_uom": "Default Unit of Measure",
        "go_back": "Go Back",
        "loading_global_items": "Loading Global Items...",
        "global_items": "Global Items",
        "loading": "Loading...",
        "logging_in": "Logging In...",
        "loading_item": "Loading Item...",
        "add_new_category": "Add new category",
        "add_mew_uom":"Add new Unit of Measure",
        "plural_description": "Plural Description",
        "delete_this_item": "Delete this item?",
        "really_delete_this_item":"Do you really want to delete this item?",
        "editing_item":"Editing Item:",
        "take_photo": "Take Photo",
        "delete_photo": "Delete Photo",
        "change_here_change_all_below":"Change values here to change on all lists below",
        "item_note": "Item Note",
        "list_group": "List Group",
     },
     "error" : {
        "invalid_dbuuid" : "Invalid Database Unique Identifier",
        "could_not_contact_api_server": "Could not contact API server",
        "invalid_jwt_token": "Invalid JWT Token",
        "db_server_not_available": "DB Server Not Available",
        "no_existing_credentials_found": "No existing credentials found",
        "no_api_server_url_entered":"No API Server URL entered",
        "no_couchdb_url_found":"No CouchDB URL found",
        "invalid_api_url": "Invalid API URL",
        "invalid_couchdb_url": "Invalid CouchDB URL",
        "no_database_name_found":"No database name found",
        "no_database_username_entered": "No database user name entered",
        "username_6_chars_or_more": "Please enter username of 6 characters or more",
        "invalid_username_format":"Invalid username format",
        "invalid_fullname_format":"Invalid full name format",
        "no_email_entered":"No email entered",
        "invalid_email_format": "Invalid email format",
        "no_password_entered":"No password entered",
        "password_not_long_enough":"Password not long enough. Please have 6 character or longer password",
        "passwords_no_match":"Passwords do not match",
        "could_not_find_items": "Could not find items",
        "loading_item_info_restart": "Error Loading Item Information... Restart.",
        "no_items_available": "No Items Available",
        "loading_category_info": "Error Loading Category Information... Restart.",
        "must_enter_a_name": "Must Enter a Name",
        "duplicate_category_name": "Duplicate Category Name",
        "updating_category": "Error updating category",
        "please_retry": "Please Retry",
        "unable_remove_category_items":"Unable to remove category from items",
        "unable_remove_category_lists":"Unable to remove category from lists",
        "unable_delete_category": "Unable to delete category",
        "loading_conflict_info": "Error Loading Conflict Information... Restart.",
        "loading_conflict_log": "Error Loading Conflict Log... Restart.",
        "no_items_in_conflict_log": "No Items In Conflict Log",
        "error": "Error...",
        "error_in_application": "Error in Application. Restart.",
        "loading_friend_info": "Error Loading Friend Information... Restart.",
        "confirming_friend": "Error confirming friend. Please retry.",
        "friend_already_exists": "Friend already exists with this email",
        "creating_friend": "Error creating friend. Please retry.",
        "loading_global_items": "Error Loading Global Items... Restart.",
        "loading_global_item": "Error Loading Global Item Information... Restart.",
        "no_global_items_available": "No Global Items Available",
        "loading_list_info":"Error Loading List Information... Restart.",
        "cannot_use_name_existing_item": "Cannot use name of existing item in list group",
        "cannot_use_name_existing_globalitem": "Cannot use name of existing item in global item list",
        "updating_item": "Error updating item. Please retry.",
        "adding_category": "Error adding category. Please retry.",
        "uom_exists": "Requested UOM Already exists. Please retry.",
        "uom_length_error": "Units of measure must be 2 characters. Please retry.",
        "no_uom_description": "No UOM Description entered. Please retry.",
        "uom_description_exists": "Requested UOM Description Already exists. Please retry.",
        "no_uom_plural_description":"No UOM Plural description entered. Please retry.",
        "uom_plural_description_exists":"Requested UOM Plural Description Already exists. Please retry.",
        "adding_uom": "Error adding unit of measure. Please retry."
        },
    "itemtext": {
        "item_is_on_these_lists": "Item is on these lists:",
        "highlighted_lists_diff_values": "Highlighted lists have different values at the item-list level",
        "list_values": "List Values",
        "item_was_purchased_from_here": "Item was Purchased From Here"
    },
    "categories": {
        "bakery": "Bakery",
        "deli": "Deli",
        "dairy": "Dairy",
        "baking": "Baking",
        "cannedmeat": "Canned Meat",
        "chips": "Snacks-Chips",
        "pretzels": "Snacks-Pretzels",
        "cookies": "Snacks-Cookies",
        "crackers": "Snacks-Crackers",
        "nuts": "Snacks-Nuts",
        "cannedvegetables": "Canned Vegetables",
        "cannedsoup": "Canned Soup",
        "paperproducts": "Paper Products",
        "juice": "Juice",
        "soda": "Soda",
        "pharmacy": "Pharmacy",
        "beverages": "Beverages",
        "frozentreats": "Frozen Treats/Ice Cream",
        "frozendinners": "Frozen Dinners",
        "frozenvegetables": "Frozen Vegetables",
        "frozenother": "Frozen Other",
        "laundry": "Laundry",
        "meat": "Meat",
        "seafood": "Seafood",
        "produce": "Produce",
        "condiments": "Condiments",
        "mexican": "Mexican",
        "asian": "Asian",
        "italian": "Italian",
        "cereal": "Cereal",
        "bread" : "Bread",
        "alcohol" : "Alcohol",
        "floral": "Floral",
        "petfood": "Pet Food",
        "cleaning": "Cleaning",
        "hair": "Hair Products-Shampoo/Conditioner",
        "auto": "Automotive",
        "office": "Office Supplies",
        "beauty": "Beauty Products"
    },
    "uom": {
        "EA": "Each",        
        "X2": "Bunch",
        "OZ": "Ounce",
        "FO": "Fluid Ounce",
        "LB": "Pound",
        "GA": "Gallon",
        "GH": "Half Gallon",
        "QT": "Quart",
        "LT": "Liter",
        "ML": "Milliliter",
        "KG": "Kilogram",
        "GR": "Gram",
        "BX": "Box",
        "BG": "Bag",
        "BO": "Bottle",
        "CA": "Case",
        "CN": "Can",
        "CU": "Cup",
        "CT": "Carton",
        "CH": "Container",
        "DZ": "Dozen",
        "JR": "Jar",
        "X8": "Loaf",
        "Y1": "Slice",
        "15": "Stick",
        "PC": "Piece",
        "PK": "Package",
        "PT": "Pint",
        "RL": "Roll"
    },
    "globalitem": {
        "bananas": "Bananas",
        "cosmiccrisp": "Cosmic Crisp Apples",
        "blueberries": "Blueberries",
        "blackberries": "Blackberries",
        "strawberries": "Strawberries",
        "raspberries": "Raspberries",
        "apples": "Apples",
        "redpeppers": "Red Peppers",
        "greenpeppers": "Green Peppers",
        "orangepeppers": "Orange Peppers",
        "potatoes": "Potatoes",
        "sweetpotatoes": "Sweet Potatoes",
        "babyspinach": "Baby Spinach",
        "iceberglettuce": "Iceberg Lettuce",
        "mixedgreens": "Mixed Greens Lettuce",
        "redseedlessgrapes": "Red Seedless Grapes",
        "greenseedlessgrapes": "Green Seedless Grapes",
        "avocado": "Avocado",
        "mandarins": "Mandarins",
        "tangerines": "Tangerines",
        "orangesseedless": "Oranges Seedless",
        "lemon": "Lemon",
        "lime": "Lime",
        "canteloupe": "Canteloupe",
        "honeydewmelon": "Honeydew Melon",
        "watermelon": "Watermelon",
        "seedlesswatermelon": "Seedless Watermelon",
        "cherries": "Cherries",
        "pineapple": "Pineapple",
        "mango": "Mango",
        "kiwi": "Kiwi Fruit",
        "pear": "Pear",
        "peaches": "Peaches",
        "plum": "Plum",
        "onion": "Onion",
        "celery": "Celery",
        "babycarrots": "Baby Carrots",
        "tomatoes": "Tomatoes",
        "grapetomatoes": "Grape Tomatoes",
        "cucumber": "Cucumber",
        "carrots": "Carrots",
        "broccoli": "Broccoli",
        "mushrooms": "Mushrooms",
        "asparagus": "Asparagus",
        "garlic": "Garlic",
        "cilantro": "Cilantro",
        "corn": "Corn",
        "cauliflower": "Cauliflower",
        "jalapenopepper": "Jalapeno Pepper",
        "brusselsprouts": "Brussel Sprouts",
        "parsley": "Parsley",
        "ginger": "Ginger",
        "greenbeans": "Green Beans",
        "squash": "Squash",
        "zucchini": "Zucchini",
        "kale": "Kale",
        "basil": "Basil",
        "radishes": "Radishes",
        "cabbage": "Cabbage",
        "eggplant": "Eggplant",
        "spinach": "Spinach",
        "beets": "Beets",
        "serranopeppers": "Serrano Peppers",
        "romainelettuce": "Romaine Lettuce",
        "coleslaw": "Cole Slaw",
        "shreddedlettuce": "Shredded Lettuce",
        "salami": "Salami",
        "pepperoni": "Pepperoni",
        "deliham": "Deli Ham",
        "slicedswisscheese": "Sliced Swiss Cheese",
        "bologna": "Bologna",
        "slicedturkey": "Sliced Turkey",
        "slicedprovolone": "Sliced Provolone",
        "rotisseriechicken": "Rotisserie Chicken",
        "wholemilk": "Whole Milk",
        "1percentmilk": "1% Milk",
        "2percentmilk": "2% Milk",
        "skimmilk": "Skim Milk",
        "orangejuice": "Orange Juice",
        "freshlemonade": "Fresh Lemonade",
        "butter": "Butter",
        "eggs": "Eggs",
        "sourcream": "Sour Cream",
        "cottagecheese": "Cottage Cheese",
        "whippedcream": "Whipped Cream",
        "whitebread": "White Bread",
        "wheatbread": "Wheat Bread",
        "cinnamonraisinbread": "Cinnamon Raisin Bread",
        "englishmuffins": "English Muffins Plain",
        "englishmuffinscinnamonraisin": "English Muffins Cinnamon Raisin",
        "frenchbread": "French Bread",
        "italianbread": "Italian Bread",
        "blueberrymuffins": "Blueberry Muffins",
        "cinnamonmuffins": "Cinnamon Muffins",
        "chocolatechipmuffins": "Chocolate Chip Muffins",
        "groundbeef": "Ground Beef",
        "filetmignon": "Filet Mignon",
        "stripsteak": "Strip Steak",
        "chickenbreasts": "Chicken Breasts",
        "chickendrumsticks": "Chicken Drumsticks",
        "italiansausage": "Italian Sausage",
        "salmon": "Salmon",
        "freshshrimp": "Fresh Shrimp",
        "chips": "Chips",
        "bbqchips": "BBQ Chips",
        "sourcreamonionchips": "Sour Cream & Onion Chips",
        "tortillachips": "Tortilla Chips",
        "pretzels": "Pretzels",
        "minipretzels": "Mini Pretzels",
        "saltines": "Saltines",
        "almonds": "Almonds",
        "peanuts": "Peanuts",
        "honeyroastedpeanuts": "Honey Roasted Peanuts",
        "mixednuts": "Mixed Nuts",
        "walnuts": "Walnuts",
        "pistachios": "Pistachios",
        "cannedcorn": "Canned Corn",
        "cannedcreamcorn": "Canned Cream Corn",
        "cannedgreenbeans": "Canned Green Beans",
        "cannedpeas": "Canned Peas",
        "cannedmushroomssliced": "Canned Mushrooms (sliced)",
        "cannedmushrooms": "Canned Mushrooms",
        "cannedtomatosauce": "Canned Tomato Sauce",
        "cannedtomatopaste": "Canned Tomato Paste",
        "cannedpetitedicedtomatoes": "Canned Petite Diced Tomatoes",
        "tomatosoup": "Tomato Soup",
        "chickennoodlesoup": "Chicken Noodle Soup",
        "creamofmushroomsoup": "Cream of Mushroom Soup",
        "creamofchickensoup": "Cream of Chicken Soup",
        "vegetablesoup": "Vegetable Soup",
        "bluecheesedressing": "Blue Cheese Salad Dressing",
        "ranchdressing": "Ranch Salad Dressing",
        "balsalmicvinaigrettedressing": "Balsamic Vinaigrette Salad Dressing",
        "worcestershiresauce": "Worcestershire Sauce",
        "soysauce": "Soy Sauce",
        "applejuice": "Apple Juice",
        "whitegrapejuice": "White Grape Juice",
        "grapejuice": "Grape Juice",
        "tomatojuice": "Tomato Juice",
        "cranberryjuice": "Cranberry Juice",
        "coke": "Coke",
        "dietcoke": "Diet Coke",
        "pepsi": "Pepsi",
        "dietpepsi": "Diet Pepsi",
        "bottledwater": "Bottled Water",
        "seltzerwater": "Seltzer Water",
        "sparklingwater": "Sparkling Water",
        "vanillaicecream": "Vanilla Ice Cream",
        "chocolateicecream": "Chocolate Ice Cream",
        "neopolitanicecream": "Neopolitan Ice Cream",
        "frozenspinach": "Frozen Spinach",
        "frozenbroccoli": "Frozen Broccoli",
        "frozenpetitebroccoliflorets": "Frozen Broccoli Petite Florets",
        "frozencorn": "Frozen Corn",
        "frozengreenbeans": "Frozen Green Beans",
        "frozenpeas": "Frozen Peas",
        "frozenstrawberries": "Frozen Strawberries",
        "frozenblueberries": "Frozen Blueberries",
        "frozenwaffles": "Frozen Waffles",
        "frozenpancakes": "Frozen Pancakes",
        "frozentatertots": "Frozen Tater Tots",
        "frozenfrenchfries": "Frozen French Fries",
        "pierogies": "Pierogies",
        "ketchup": "Ketchup",
        "bbqsauce": "BBQ Sauce",
        "blackolives": "Black Olives",
        "vegetableoil": "Vegetable Oil",
        "oliveoil": "Olive Oil",
        "semisweetchocchips": "Semi-Sweet Chocolate Chips",
        "darkchocchips": "Dark Chocolate Chips",
        "marshmallows": "Marshmallows",
        "cornbreadmix": "Cornbread Mix",
        "flour": "Flour",
        "chiaseeds": "Chia Seeds",
        "flaxseed": "Flaxseed",
        "bakingsoda": "Baking Soda",
        "bakingpowder": "Baking Powder",
        "wheatflour": "Wheat Flour",
        "sugar": "Sugar",
        "confectionerssugar": "Confectioners Sugar",
        "cinnamon": "Cinnamon",
        "salt": "Salt",
        "groundpepper": "Ground Pepper",
        "chilipowder": "Chili Powder",
        "basildried": "Basil (dried)",
        "oregano": "Oregano",
        "nutmeg": "Nutmeg",
        "groundginger": "Ground Ginger",
        "spaghettisauce": "Spaghetti Sauce",
        "pizzasauce": "Pizza Sauce",
        "spaghetti": "Spaghetti",
        "pastashells": "Pasta - Shells",
        "pastabowtie": "Pasta - Bowtie",
        "pastarotini": "Pasta - Rotini",
        "pastatricolorrotini": "Pasta - Tricolor-Rotini",
        "cannedtunawater": "Canned Tuna in Water",
        "cannedtunaoil": "Canned Tuna in Oil",
        "cannedsalmon": "Canned Salmon",
        "salmonpouch": "Salmon Pouch",
        "dishwashingliquid": "Dishwashing Liquid",
        "dishwashingdetergent": "Dishwashing Detergent",
        "sponges": "Sponges",
        "toiletbowlcleaner": "Toilet Bowl Cleaner",
        "handsoap": "Hand Soap",
        "bleachcleaner": "Bleach Cleaner",
        "bleach": "Bleach",
        "laundrydetergent": "Laundry Detergent",
        "fabricsoftener": "Fabric Softener",
        "colorbleach": "Color Bleach",
        "laundrypods": "Laundry Pods",
        "disinfectingwipes": "Disinfecting Wipes",
        "steelwoolpads": "Steel Wool Pads",
        "drainclogremover": "Drain Clog Remover",
        "bandaids": "Band Aids",
        "cottonballs": "Cotton Balls",
        "nailpolishremover": "Nail Polish Remover",
        "notebook": "Notebook",
        "scotchtape": "Scotch Tape",
        "maskingtape": "Masking Tape",
        "packagingtape": "Packaging Tape",
        "copypaper": "Copy Paper",
        "superglue": "Super Glue",
        "glue": "Glue",
        "crayons": "Crayons",
        "pencils": "Pencils",
        "pens": "Pens",
        "envelopes": "Envelopes",
        "paperclips": "Paper Clips",
        "rubberbands": "Rubber Bands",
        "scissors": "Scissors",
        "papertowels": "Paper Towels",
        "toiletpaper": "Toilet Paper",
        "tacoshells": "Taco Shells",
        "salsajar": "Salsa (Jar)",
        "tacoseasoning": "Taco Seasoning",
        "tortillas": "Tortillas",
        "raisinbran": "Raisin Bran",
        "maplesyrup": "Maple Syrup",
        "windshieldwiperfluid": "Windshield Wiper Fluid"
    }
    }

