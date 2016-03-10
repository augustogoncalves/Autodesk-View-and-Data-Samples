///////////////////////////////////////////////////////////////////////////////
// Autodesk.ADN.Viewing.Extension.Chart.RGraph
// by Augusto Goncalves, February 2016
//
//
// Dependencies:
// <script src="//code.responsivevoice.org/responsivevoice.js"></script>
// <script src="//cdnjs.cloudflare.com/ajax/libs/annyang/2.2.1/annyang.min.js"></script>
//
// The 'look around' command needs this extension
//  <script src="http://viewer.autodesk.io/node/gallery/uploads/extensions/Autodesk.ADN.Viewing.Extension.Explorer/Autodesk.ADN.Viewing.Extension.Explorer.js"></script>
//
///////////////////////////////////////////////////////////////////////////////

AutodeskNamespace('Autodesk.ADN.Viewing.Extension.Voice');

Autodesk.ADN.Viewing.Extension.Voice = function (viewer, options) {
    Autodesk.Viewing.Extension.call(this, viewer, options);

    var _self = this;

    ///////////////////////////////////////////////////////////////////////////
    // load callback
    //
    ///////////////////////////////////////////////////////////////////////////

    _self.load = function () {
        if (annyang) {
            // Let's define our first command. First the text we expect, and then the function it should call
            var commands = {
                'explode by *percent': function (percent) {
                    var ratio = parseInt(percent);
                    if (ratio < 0 || ratio > 100)
                        say('Sorry, you need a number between 0 and 100');
                    else
                        viewer.explode(ratio / 100);
                },
                'isolate (by) *propName *propValue': function (propName, propValue) {
                    if (!propName || !propValue) return;
                    isolateBy(propName.toLowerCase(), propValue.toLowerCase());
                    say('isolating by ' + propName + ' ' + propValue + '. Say SHOW ALL to restore');
                },
                'show all': function () {
                    viewer.showAll();
                    say('everything is now visible');
                },
                '(let\'s) (take) (a) look around': function () {
                    loadedExtension = 'Autodesk.ADN.Viewing.Extension.Explorer'; // keep record
                    viewer.loadExtension(loadedExtension);
                    if (!lookAroundFirstTime) {
                        say('let\'s take a look around this beautiful model and say STOP when you\'re done');
                        lookAroundFirstTime = true;
                    }
                },
                'stop': function () {
                    viewer.unloadExtension(loadedExtension);
                },
                'home': function () {
                    viewer.navigation.setRequestHomeView(true);
                },
                'commands': function(){
                  showCommandsPanel();  
                }
            };

            annyang.addCommands(commands);
            annyang.debug(true);
            annyang.start();
            
            viewer.addEventListener('geometryLoaded', function(){
               say('Welcome to interactive View and Data. Say COMANDS for a list of what\'s possible.'); 
            });
        }

        console.log('Voice interaction loaded extension loaded');
        return true;
    };

    var lookAroundFirstTime = false;
    var loadedExtension = '';

    function say(msg, callback) {
        console.log('Pause annyang');
        annyang.abort();
        responsiveVoice.speak(msg, "US English Female", {
            onend: function () {
                console.log('Resume annyang');
                annyang.start();
            }
        });
    }

    var count = 0;
    var ids = [];

    function isolateBy(propertyName, propertyValue) {
        viewer.getObjectTree(function (objTree) {
            var root = objTree.root;

            ids = [];
            count = 0;

            if (!root) {
                return alldbId;
            }
            var queue = [];
            queue.push(root); //push the root into queue
            while (queue.length > 0) {
                var node = queue.shift(); // the current node
                count++;
                viewer.getProperties(node.dbId, function (result) {
                    count--;
                    for (var i = 0; i < result.properties.length; i++) {
                        var prop = result.properties[i];
                        if (prop.displayName.toLowerCase().indexOf(propertyName) >= 0) {
                            if (prop.displayValue.toLowerCase().indexOf(propertyValue) >= 0)
                                ids.push(result.dbId);
                        }
                    }
                });

                if (node.children) {
                    // put all the children in the queue too
                    for (var i = 0; i < node.children.length; i++) {
                        queue.push(node.children[i]);
                    }
                }
            };

            // we need to wait util all recursive functions have ended
            setTimeout(function () {
                isolate();
            }, 1000);
        });
    };

    function isolate() {
        if (count == 0)
            viewer.isolate(ids);
        else
            setTimeout(function () {
                isolate();
            }, 1000);
    }
    
    function showCommandsPanel() {
        var commandsPanels = new Autodesk.Viewing.UI.DockingPanel(viewer.container, 'commandsPanel', 'List of voice commands');

        commandsPanels.container.style.top = "10px";
        commandsPanels.container.style.left = "10px";

        commandsPanels.container.style.width = "auto";
        commandsPanels.container.style.height = "auto";
        commandsPanels.container.style.resize = "auto";

        var div = document.createElement('div');
        div.style.color = '#FFFFFF';
        div.innerHTML = 'Explode by 0-100</br>Isolate by [property name] [property value]</br>Look around</br>Home</br>';
        
        commandsPanels.container.appendChild(div);

        commandsPanels.setVisible(true);
        
    }

    ///////////////////////////////////////////////////////////////////////////
    // unload callback
    //
    ///////////////////////////////////////////////////////////////////////////
    _self.unload = function () {

        console.log('Voice interaction unloaded');
        return true;
    };

};
Autodesk.ADN.Viewing.Extension.Voice.prototype = Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.Voice.prototype.constructor = Autodesk.ADN.Viewing.Extension.Voice;

Autodesk.Viewing.theExtensionManager.registerExtension('Autodesk.ADN.Viewing.Extension.Voice', Autodesk.ADN.Viewing.Extension.Voice);