/*
 * =============================================================================
 * Vault
 * =============================================================================
 * December game for One Game A Month
 *
 * (c) 2013 chrisatthestudy
 * -----------------------------------------------------------------------------
 * See the end of this file for the main entry point
 */

// Main module, container for the entire application 
var Main = (function() {
//{{{

    var gLevel = 1;
    var gGuessed = false;
    var gFailed = false;
    var gRound = null;
    var gScore = 0;
        
    /*
     * =========================================================================
     * DebugConsole() - simple console display
     * =========================================================================
     */
    //{{{
    var DebugConsole = function( options ) {
        
        var self = {
            
            // -----------------------------------------------------------------
            // setup()
            // -----------------------------------------------------------------
            // Initialises the object. This is called automatically when the object
            // is created.
            //{{{
            setup: function( options ) {
                this.visible = true;
            },
            //}}}
            
            // -----------------------------------------------------------------
            // update()
            // -----------------------------------------------------------------
            // Updates the internal state of the console. This must be called from
            // the update() function of the current game state.
            //{{{
            update: function( ) {
            },
            //}}}
    
            // -----------------------------------------------------------------
            // draw()
            // -----------------------------------------------------------------
            // Renders the console on screen. This must be called from the draw()
            // function of the current game state.
            //{{{        
            draw: function( ) {
                if (this.visible) {
                    // Draw the console backgLevel as a semi-transparent rectangle
                    // at the top of the screen
                    jaws.context.font      = "12px Georgia";
                    jaws.context.textAlign = "left";
                    jaws.context.fillStyle = "rgba(128, 128, 128, 0.5";
                    jaws.context.fillRect( 0, 0, jaws.width, 64 );
                    jaws.context.fillStyle = "#ffffff";
                    jaws.context.fillText("Mouse: " + jaws.mouse_x + ", " + jaws.mouse_y, 8, 16);
                    jaws.context.fillText("Ticks: " + jaws.game_loop.ticks, 8, 32);
                    jaws.context.fillText("FPS: " + jaws.game_loop.fps, 8, 48);
                }
            }
            //}}}
        };
    
        // Initialise the object and return it.    
        self.setup( options );
        return self;
    };
    //}}}
    
    /*
     * =============================================================================
     * Button() - Simple two-state button
     * =============================================================================
     * Usage:
     *   this.button = Button({image: "graphics/button.png", x: 160, y: 400, width: 64, height: 36});
     */
    //{{{
    var Button = function(options) {
        "use strict";
        var self = {
            setup: function(options) {
                this.x = options.x || 0;
                this.y = options.y || 0;
                this.state = 0;
                this.tag = options.tag || 0;
                this.on_action = options.on_action || null;
                this.sprite = new jaws.Sprite({x: this.x, y: this.y});
                this.frames = new jaws.Animation({sprite_sheet: options.image, frame_size: [options.width, options.height]});
            },
            update: function() {
                this.sprite.setImage(this.frames.frames[this.state]);
            },
            draw: function() {
                this.sprite.draw();
            },
            on_press: function(x, y) {
                if (this.sprite.rect().collidePoint(x, y)) {
                    this.state = 1;
                    if (this.on_action) {
                        this.on_action(self);
                    }
                }
            },
            on_release: function(x, y) {
                if (this.state == 1) {
                    this.state = 0;
                }
            }
        };
        
        self.setup(options);
        return self;
    };
    //}}}
    
    /*
     * Indicators() - row of indicator lights
     */
    //{{{
    var Indicators = function(options) {
        "use strict";
        var self = {
            setup: function(options) {
                this.count = options.count || 4;
                this.x = options.x;
                this.y = options.y;
                this.lights = [];
                for (var i = 0; i < this.count; i++) {
                    this.lights.push(Button({image: "graphics/indicator_light.png", x: this.x + (i * 24), y: this.y, width: 24, height: 27})); 
                }
            },
            update: function() {
                for (var i = 0; i < this.count; i++) {
                    this.lights[i].update();
                }
            },
            draw: function() {
                for (var i = 0; i < this.count; i++) {
                    this.lights[i].draw();
                }
            },
            reset: function() {
                for (var i = 0; i < this.count; i++) {
                    this.lights[i].state = 0;
                }
            }
        };
        self.setup(options);
        return self;
    };
    //}}}
    /*
     * =========================================================================
     * Digit() - holds a single digit of the password
     * =========================================================================
     */
    //{{{
    var Digit = function(options) {
        "use strict";
        var self = {
            value: 1,
            setup: function(options) {
                this.value = options.value || 0;
                this.x = options.x || 0;
                this.y = options.y || 0;
                this.up_arrow = Button({image: "graphics/button_up.png", on_action: self.inc, x: this.x, y: 152, width: 76, height: 36});
                this.down_arrow = Button({image: "graphics/button_down.png", on_action: self.dec, x: this.x, y: 292, width: 76, height: 36});

                this.clickSound = new Audio("sounds/click.ogg");
            },
            update: function() {
                this.up_arrow.update();
                this.down_arrow.update();
            },
            draw: function() {
                this.up_arrow.draw();
                jaws.context.fillText(this.value, this.x + 40, 260);
                this.down_arrow.draw();
            },
            inc: function() {
                self.value = self.value + 1;
                self.clickSound.currentTime = 0;
                self.clickSound.play();
                if (self.value > 9) {
                    self.value = 1;
                }
            },
            dec: function() {
                self.value = self.value - 1;
                self.clickSound.currentTime = 0;
                self.clickSound.play();
                if (self.value < 1) {
                    self.value = 9;
                }
            },
            on_press: function(x, y) {
                this.up_arrow.on_press(x, y);
                this.down_arrow.on_press(x, y);
            },
            on_release: function(x, y) {
                this.up_arrow.on_release(x, y);
                this.down_arrow.on_release(x, y);
            }
        };
        self.setup(options);
        return self;
    };
    //}}}
    
    /*
     * =========================================================================
     * Round() - holds the details for a single round of the game
     * =========================================================================
     */
    //{{{
    var Round = function(options) {
        "use strict";
        var self = {
            number: 1,        // The level number
            parts: 4,         // The number of lock parts (digits in the password)
            password: [],     // The password that the player is trying to guess
            guess: [],        // The player's current guess
            limit: 20,        // Number of guesses allowed
            attempts: 0,      // Number of guesses currently taken
            time: 0,          // Unlimited time
            correct: 0,       // Number of correct digits in the player's guess
            in_place: 0,      // Number of correct digits in the correct place
            guessed: false,   // Does the current guess match the password?
            duplicates: false,// Are duplicated digits allowed in the code?
            x: 64,            // Position of the display
            y: 170,
            setup: function(options) {
                // Set up the options
                this.parts = options.parts || 4;
                this.time  = options.time  || 0;
                this.score = 0;
                this.correct_indicators = Indicators({x: 342, y: 352});
                this.inplace_indicators = Indicators({x: 342, y: 386});
                this.openSound = new Audio("sounds/open_vault.ogg");
                this.coinSound = new Audio("sounds/coins.ogg");
                this.alarmSound = new Audio("sounds/alarm.ogg");
                this.music = new Audio("sounds/vendetta.ogg");
                this.music.volume = 0.25;
                this.music.addEventListener("ended", function () {
                    this.currentTime = 0;
                    this.play();
                }, false);
            },
            
            prepare: function() {
                var digit;

                this.score = 0;
                this.attempts = 0;
                gGuessed = false;
                gFailed = false;

                this.duplicates = (gLevel > 5);

                if (this.duplicates) {
                    if (gLevel < 10) {
                        this.limit = 20 - ((gLevel - 6) * 2);
                    } else {
                        this.limit = 10;
                    }
                } else {
                    if (gLevel < 5) {
                        this.limit = 20 - ((gLevel - 1) * 2);
                    } else {
                        this.limit = 10;
                    }
                }
                
                // Prepare the password
                this.password = [];
                this.guess = [];
                var i;
                for(i = 0; i < this.parts; i++) {
                    digit = Math.floor(Math.random() * 8) + 1;
                    if (!this.duplicates) {
                        // Ensure that this digit is not already in the password
                        while (this.password.indexOf(digit) != -1) {
                            digit = Math.floor(Math.random() * 8) + 1;
                        }
                    }
                    this.password[i] = digit;
                    this.guess[i] = Digit({value: 1, x: 52 + (i * 100), y: this.y});
                }
                self.correct_indicators.reset();
                self.inplace_indicators.reset();
            },
            
            update: function() {
                for (var i = 0; i < this.parts; i++) {
                    this.guess[i].update();
                }
                this.correct_indicators.update();
                this.inplace_indicators.update();
            },
            
            draw: function() {
                jaws.context.font      = "36px Georgia";
                jaws.context.fillStyle = "#000000";
                jaws.context.textAlign = "center";
                jaws.context.fillText("Level " + gLevel, 240, 124);
                
                jaws.context.font      = "24px Georgia";
                jaws.context.fillText(this.limit - this.attempts, 384, 440);
                
                jaws.context.font      = "64px Georgia";
                jaws.context.fillStyle = "#000000";
                jaws.context.textAlign = "center";
                for (var i = 0; i < this.parts; i++) {
                    this.guess[i].draw();
                }
                this.correct_indicators.draw();
                this.inplace_indicators.draw();
            },

            check: function() {
                // Array to indicate which password digits have already been
                // matched.
                var matched = [false, false, false, false];
                var value;
                self.correct = 0;
                self.in_place = 0;
                self.correct_indicators.reset();
                self.inplace_indicators.reset();
                for(var i = 0; i < self.parts; i++) {
                    value = self.guess[i].value;
                    for (var j = 0; j < self.parts; j++) {
                        if ((value === self.password[j])) {
                            if (i == j) {
                                self.in_place = self.in_place + 1;
                            }
                        }
                        if ((value === self.password[j]) && (!matched[j])) {
                            self.correct = self.correct + 1;
                            matched[j] = true;
                            // If repeated digits are not allowed, break out
                            // as soon as we have found one occurence of this
                            // digit
                            if (!this.duplicates) {
                              break;
                            }
                        }
                    }
                }
                for (var i = 0; i < self.correct; i++) {
                    self.correct_indicators.lights[i].state = 1;
                }
                for (var i = 0; i < self.in_place; i++) {
                    self.inplace_indicators.lights[i].state = 1;
                }
                gGuessed = (self.in_place == self.parts);
                if (!gGuessed) {
                    self.attempts = self.attempts + 1;
                    gFailed = (self.attempts >= self.limit);
                }
                self.openSound.currentTime = 0;
                self.openSound.play();
                if (gGuessed) {
                    self.coinSound.currentTime = 0;
                    self.coinSound.play();
                    self.music.pause();
                    self.score = (self.limit - self.attempts) * gLevel;
                    gScore = gScore + self.score;
                } else if (gFailed) {
                    self.alarmSound.currentTime = 0;
                    self.alarmSound.play();
                    self.music.pause();
                }
            },
            
            on_press: function(x, y) {
                for (var i = 0; i < this.parts; i++) {
                    this.guess[i].on_press(x, y);
                }
            },
            
            on_release: function(x, y) {
                for (var i = 0; i < this.parts; i++) {
                    this.guess[i].on_release(x, y);
                }
            },
            
            code: function() {
                var result = "";
                for (var i = 0; i < this.parts; i++) {
                    result = result + this.password[i] + " ";
                }
                return result;
            }
        };
        self.setup(options);
        return self;
    }
    //}}}

    /*
     * =========================================================================
     * Intro() - Intro state handler
     * =========================================================================
     */
    //{{{
    var Intro = function() {
        "use strict";
        
        var self = {
            // -----------------------------------------------------------------
            // setup()
            // -----------------------------------------------------------------
            // Creates and initialises the game components. This is called
            // automatically by the jaws library.
            //{{{
            setup: function() {
                // Load the backdrop
                this.backdrop = new jaws.Sprite({image: "graphics/board.png"});
                
                // Load the instructions
                this.instructions = new jaws.Sprite({image: "graphics/intro.png", x: 0, y: 0});
                
                // Set up the button
                this.button_rect = new jaws.Rect(203, 412, 72, 32);

                // Direct any mouse-clicks to our event-handlers
                jaws.on_keydown(["left_mouse_button", "right_mouse_button"], function(key) { self.on_press(key); });
                jaws.on_keyup(["left_mouse_button", "right_mouse_button"], function(key) { self.on_release(key); });
            },
            //}}}
            
            // -----------------------------------------------------------------
            // update()
            // -----------------------------------------------------------------
            // Updates the game components. This is called automatically by the
            // jaws library.
            //{{{        
            update: function() {
            },
            //}}}
            
            // -----------------------------------------------------------------
            // draw()
            // -----------------------------------------------------------------
            // Draws the game components. This is called automatically by the jaws
            // library.
            //{{{
            draw: function() {
                // Draw the main baord
                this.backdrop.draw();
                // Draw the instructions graphics
                this.instructions.draw();
                // Draw the button text
                jaws.context.font      = "18px Typewriter";
                jaws.context.textAlign = "center";
                jaws.context.fillStyle = "#000000";
                jaws.context.fillText("Next", 240, 432);
            },
            //}}}

            // -----------------------------------------------------------------
            // on_press()
            // -----------------------------------------------------------------
            // This callback is called by the jaws library when the mouse is 
            // pressed. See the jaws.on_keydown() call in the setup() method.
            //{{{        
            on_press: function(key) {
                var x = jaws.mouse_x;
                var y = jaws.mouse_y - 16;
                if (key === "left_mouse_button") {

                }
            },
            //}}}
            
            // -----------------------------------------------------------------
            // on_release()
            // -----------------------------------------------------------------
            // This callback is called by the jaws library when the mouse is 
            // released. See the jaws.on_keyup() call in the setup() method.
            //{{{        
            on_release: function(key) {
                var x = jaws.mouse_x;
                var y = jaws.mouse_y - 16;
                if (key === "left_mouse_button") {
                    if (this.button_rect.collidePoint(x, y)) {
                        jaws.switchGameState(LevelIntro);
                    }
                }
            }
            //}}}
        };
        
        return self;
    }
    //}}}
    
    /*
     * =========================================================================
     * LevelIntro() - Level intro state handler
     * =========================================================================
     */
    //{{{
    var LevelIntro = function() {
        "use strict";
        
        var self = {
            // -----------------------------------------------------------------
            // setup()
            // -----------------------------------------------------------------
            // Creates and initialises the game components. This is called
            // automatically by the jaws library.
            //{{{
            setup: function() {
                // Load the backdrop
                this.backdrop = new jaws.Sprite({image: "graphics/board.png"});
                
                // Load the instructions
                this.instructions = new jaws.Sprite({image: "graphics/level.png", x: 0, y: 0});
                
                // Set up the button
                this.button_rect = new jaws.Rect(203, 412, 72, 32);
                
                // If necessary, create the Round handler
                if (!gRound) {
                    gRound = Round({});
                }
                gRound.prepare();
                
                // Direct any mouse-clicks to our event-handlers
                jaws.on_keydown(["left_mouse_button", "right_mouse_button"], function(key) { self.on_press(key); });
                jaws.on_keyup(["left_mouse_button", "right_mouse_button"], function(key) { self.on_release(key); });
            },
            //}}}
            
            // -----------------------------------------------------------------
            // update()
            // -----------------------------------------------------------------
            // Updates the game components. This is called automatically by the
            // jaws library.
            //{{{        
            update: function() {
            },
            //}}}
            
            // -----------------------------------------------------------------
            // draw()
            // -----------------------------------------------------------------
            // Draws the game components. This is called automatically by the jaws
            // library.
            //{{{
            draw: function() {
                // Draw the main baord
                this.backdrop.draw();
                // Draw the instructions graphics
                this.instructions.draw();
                jaws.context.font      = "32px Typewriter";
                jaws.context.textAlign = "center";
                jaws.context.fillStyle = "#000000";
                jaws.context.fillText("Level " + gLevel, 240, 112);

                jaws.context.font      = "16px Typewriter";
                jaws.context.textAlign = "center";
                jaws.context.fillText("You have " + gRound.limit + " attempts to unlock the vault.", 240, 160);
                if (gRound.duplicates) {
                    jaws.context.fillText("There may be repeated digits in the code.", 240, 200);
                } else {
                    jaws.context.fillText("There are no repeated digits in the code.", 240, 200);
                }

                // Draw the button text
                jaws.context.font      = "18px Typewriter";
                jaws.context.textAlign = "center";
                jaws.context.fillStyle = "#000000";
                jaws.context.fillText("Next", 240, 432);
            },
            //}}}

            // -----------------------------------------------------------------
            // on_press()
            // -----------------------------------------------------------------
            // This callback is called by the jaws library when the mouse is 
            // pressed. See the jaws.on_keydown() call in the setup() method.
            //{{{        
            on_press: function(key) {
                var x = jaws.mouse_x;
                var y = jaws.mouse_y - 16;
                if (key === "left_mouse_button") {

                }
            },
            //}}}
            
            // -----------------------------------------------------------------
            // on_release()
            // -----------------------------------------------------------------
            // This callback is called by the jaws library when the mouse is 
            // released. See the jaws.on_keyup() call in the setup() method.
            //{{{        
            on_release: function(key) {
                var x = jaws.mouse_x;
                var y = jaws.mouse_y - 16;
                if (key === "left_mouse_button") {
                    if (this.button_rect.collidePoint(x, y)) {
                        jaws.switchGameState(Game);
                    }
                }
            }
            //}}}
        };
        
        return self;
    }
    //}}}
    
    /*
     * =========================================================================
     * LevelEnd() - End of Level state handler
     * =========================================================================
     */
    //{{{
    var LevelEnd = function() {
        "use strict";
        
        var self = {
            // -----------------------------------------------------------------
            // setup()
            // -----------------------------------------------------------------
            // Creates and initialises the game components. This is called
            // automatically by the jaws library.
            //{{{
            setup: function() {
                // Load the backdrop
                this.backdrop = new jaws.Sprite({image: "graphics/board.png"});
                
                // Load the instructions
                this.instructions = new jaws.Sprite({image: "graphics/level.png", x: 0, y: 0});
                
                // Set up the button
                this.button_rect = new jaws.Rect(203, 412, 72, 32);
                
                // Direct any mouse-clicks to our event-handlers
                jaws.on_keydown(["left_mouse_button", "right_mouse_button"], function(key) { self.on_press(key); });
                jaws.on_keyup(["left_mouse_button", "right_mouse_button"], function(key) { self.on_release(key); });
            },
            //}}}
            
            // -----------------------------------------------------------------
            // update()
            // -----------------------------------------------------------------
            // Updates the game components. This is called automatically by the
            // jaws library.
            //{{{        
            update: function() {
            },
            //}}}
            
            // -----------------------------------------------------------------
            // draw()
            // -----------------------------------------------------------------
            // Draws the game components. This is called automatically by the jaws
            // library.
            //{{{
            draw: function() {
                var y = 280;
                
                // Draw the main baord
                this.backdrop.draw();
                // Draw the instructions graphics
                this.instructions.draw();
                jaws.context.font      = "32px Typewriter";
                jaws.context.textAlign = "center";
                jaws.context.fillStyle = "#000000";
                jaws.context.fillText("Level " + gLevel, 240, 112);

                jaws.context.font      = "16px Typewriter";
                jaws.context.textAlign = "center";
                
                if (gFailed) {
                    jaws.context.fillText("You failed to crack the code:", 240, 160);
                    jaws.context.fillText(gRound.code(), 240, 200);
                } else {
                    jaws.context.fillText("You cracked the code and opened the vault.", 240, 160);
                    jaws.context.fillText("Well done! ", 240, 200);
                    jaws.context.fillText("Score for this round = " + gRound.score, 240, y);
                    y = y + 40;
                }
                
                jaws.context.fillText("Total score = " + gScore, 240, y);

                // Draw the button text
                jaws.context.font      = "18px Typewriter";
                jaws.context.textAlign = "center";
                jaws.context.fillStyle = "#000000";
                jaws.context.fillText("Next", 240, 432);
            },
            //}}}

            // -----------------------------------------------------------------
            // on_press()
            // -----------------------------------------------------------------
            // This callback is called by the jaws library when the mouse is 
            // pressed. See the jaws.on_keydown() call in the setup() method.
            //{{{        
            on_press: function(key) {
                var x = jaws.mouse_x;
                var y = jaws.mouse_y - 16;
                if (key === "left_mouse_button") {

                }
            },
            //}}}
            
            // -----------------------------------------------------------------
            // on_release()
            // -----------------------------------------------------------------
            // This callback is called by the jaws library when the mouse is 
            // released. See the jaws.on_keyup() call in the setup() method.
            //{{{        
            on_release: function(key) {
                var x = jaws.mouse_x;
                var y = jaws.mouse_y - 16;
                if (key === "left_mouse_button") {
                    if (this.button_rect.collidePoint(x, y)) {
                        if (!gFailed) {
                            gLevel = gLevel + 1;
                        }
                        jaws.switchGameState(LevelIntro);
                    }
                }
            }
            //}}}
        };
        
        return self;
    }
    //}}}
    
    /*
     * =========================================================================
     * Game() - Main game state handler.
     * =========================================================================
     */
    //{{{ 
    var Game = function() { 
        
        var self = {
    
            // -----------------------------------------------------------------
            // Variables
            // -----------------------------------------------------------------
            //{{{
            
            // Game components. These are actually created and initialised when the
            // setup() method is called.
    
            //}}}
            
            // -----------------------------------------------------------------
            // Methods
            // -----------------------------------------------------------------
            //{{{
            
            // -----------------------------------------------------------------
            // setup()
            // -----------------------------------------------------------------
            // Creates and initialises the game components. This is called
            // automatically by the jaws library.
            //{{{
            setup: function() {
                
                // The jaws library will locate the canvas element itself, but it
                // it is useful to have our reference to it, for drawing directly
                // on to the canvas.
                this.canvas  = document.getElementById("board");
                this.context = this.canvas.getContext("2d");
                
                // Set up a default font for text output on the canvas
                this.context.font      = "12px Georgia";
                this.context.fillStyle = "#ffffff";
                this.context.textAlign = "center";
                
                // Load the backdrop for the game
                this.backdrop = new jaws.Sprite({image: "graphics/board.png"});
                
                // Load the 'Check' button
                this.check_button = Button({image: "graphics/check.png", x: 43, y: 353, width: 94, height: 94});
                this.check_button.on_action = gRound.check;
                
                this.debug = DebugConsole( { } );
                this.debug.visible = false;

                gRound.music.currentTime = 0;                
                gRound.music.play();
                
                this.paused = false;
                this.pause = 0;
                
                // Direct any mouse-clicks to our on_click event-handler
                jaws.on_keydown(["left_mouse_button", "right_mouse_button"], function(key) { self.on_press(key); });
                jaws.on_keyup(["left_mouse_button", "right_mouse_button"], function(key) { self.on_release(key); });
            },
            //}}}
    
            // -----------------------------------------------------------------
            // update()
            // -----------------------------------------------------------------
            // Updates the game components. This is called automatically by the
            // jaws library.
            //{{{        
            update: function() {
                gRound.update();
                if ((gGuessed) || (gFailed)) {
                    if (this.paused) {
                        if (this.pause > 0) {
                            this.pause = this.pause - 1;
                        } else {
                            jaws.switchGameState(LevelEnd);
                        }
                    } else {
                        this.paused = true;
                        this.pause = 200;
                    }
                } else {
                    this.check_button.update();
                }
            },
            //}}}
            
            // -----------------------------------------------------------------
            // draw()
            // -----------------------------------------------------------------
            // Draws the game components. This is called automatically by the jaws
            // library.
            //{{{
            draw: function() {
                this.backdrop.draw();
                gRound.draw();
                this.check_button.draw();
                this.debug.draw();
            },
            //}}}
            
            // -----------------------------------------------------------------
            // on_press()
            // -----------------------------------------------------------------
            // This callback is called by the jaws library when the mouse is 
            // pressed. See the jaws.on_keydown() call in the setup() method.
            //{{{        
            on_press: function(key) {
                var x = jaws.mouse_x;
                var y = jaws.mouse_y - 16;
                if (key === "left_mouse_button") {
                    if (!this.paused) {
                        this.check_button.on_press(x, y);
                        gRound.on_press(x, y);
                    }
                }
            },
            //}}}
            
            // -----------------------------------------------------------------
            // on_release()
            // -----------------------------------------------------------------
            // This callback is called by the jaws library when the mouse is 
            // released. See the jaws.on_keyup() call in the setup() method.
            //{{{        
            on_release: function(key) {
                var x = jaws.mouse_x;
                var y = jaws.mouse_y - 16;
                if (key === "left_mouse_button") {
                    if (!this.paused) {
                        this.check_button.on_release(x, y);
                        gRound.on_release(x, y);
                    }
                }
            }
            //}}}
            
            //}}}
        };
        
        return self;
        
    };
    //}}}
    
    /*
     * =========================================================================
     * Main entry point
     * =========================================================================
     * Loads the game assets and launches the game.
     */
    //{{{ 
    jaws.onload = function( ) {
        // Pre-load the game assets
        jaws.assets.add( [
                "graphics/intro.png",
                "graphics/level.png",
                "graphics/board.png",
                "graphics/button_up.png",
                "graphics/button_down.png",
                "graphics/check.png",
                "graphics/indicator_light.png"
        ] ); 
        // Start the game running. jaws.start() will handle the game loop for us.
        jaws.start( Intro, {fps: 60} ); 
    }
    //}}}

//}}}
})();

