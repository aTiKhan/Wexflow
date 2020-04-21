window.onload = function () {
    "use strict";

    let uri = Common.trimEnd(Settings.Uri, "/");
    let lnkDashoard = document.getElementById("lnk-dashboard");
    let lnkManager = document.getElementById("lnk-manager");
    let lnkDesigner = document.getElementById("lnk-designer");
    //let lnkEditor = document.getElementById("lnk-editor");
    //let lnkApproval = document.getElementById("lnk-approval");
    let lnkHistory = document.getElementById("lnk-history");
    let lnkUsers = document.getElementById("lnk-users");
    let lnkProfiles = document.getElementById("lnk-profiles");
    let btnLogout = document.getElementById("btn-logout");
    let lnkAbout = document.getElementById("lnk-about");
    let lnkHelp = document.getElementById("lnk-help");
    let navigation = document.getElementById("navigation");
    let leftcard = document.getElementById("leftcard");
    let propwrap = document.getElementById("propwrap");
    let wfclose = document.getElementById("wfclose");
    let wfpropwrap = document.getElementById("wfpropwrap");
    let canvas = document.getElementById("canvas");
    let suser = getUser();
    let username = "";
    let password = "";
    let auth = "";

    if (suser === null || suser === "") {
        Common.redirectToLoginPage();
    } else {
        let user = JSON.parse(suser);

        username = user.Username;
        password = user.Password;
        auth = "Basic " + btoa(username + ":" + password);

        Common.get(uri + "/user?username=" + encodeURIComponent(user.Username),
            function (u) {
                if (user.Password !== u.Password) {
                    Common.redirectToLoginPage();
                } else {

                    if (u.UserProfile === 0 || u.UserProfile === 1) {
                        lnkManager.style.display = "inline";
                        lnkDesigner.style.display = "inline";
                        //lnkEditor.style.display = "inline";
                        //lnkApproval.style.display = "inline";
                        lnkUsers.style.display = "inline";

                        if (u.UserProfile === 0) {
                            lnkProfiles.style.display = "inline";
                        }

                        navigation.style.display = "block";
                        leftcard.style.display = "block";
                        propwrap.style.display = "block";
                        wfclose.style.display = "block";
                        wfpropwrap.style.display = "block";
                        canvas.style.display = "block";

                        //btnLogout.onclick = function () {
                        //    deleteUser();
                        //    Common.redirectToLoginPage();
                        //};

                        btnLogout.innerHTML = "Logout (" + u.Username + ")";

                        load();
                    } else {
                        Common.redirectToLoginPage();
                    }

                }
            },
            function () { }, auth);
    }

    function load() {
        let searchtasks = document.getElementById("searchtasks");
        let leftcardHidden = true;
        let leftcardwidth = 361;
        let closecardimg = document.getElementById("closecardimg");
        let wfpropHidden = true;
        let wfpropwidth = 331;
        let closewfcardimg = document.getElementById("wfcloseimg");
        let wfclose = document.getElementById("wfclose");
        let code = document.getElementById("code-container");
        let rightcard = false;
        let tempblock;
        let tempblock2;
        let tasks = {};
        let editor = null;
        let checkId = true;
        let removeworkflow = document.getElementById("removeworkflow");
        let transition = "all .25s cubic-bezier(.05,.03,.35,1)";
        let browserOpen = false;
        let workflows = {};
        let workflowsToDelete = [];
        let openSavePopup = false;
        let workflowDeleted = false;
        let initialWorkflow = null;
        let jsonEditorChanged = false;
        let xmlEditorChanged = false;

        lnkDashoard.onclick = function () {
            let lnk = "dashboard.html";
            saveChanges(function () {
                window.location.href = lnk;
            }, function () {
                window.location.href = lnk;
            });
        };

        lnkManager.onclick = function () {
            let lnk = "manager.html";
            saveChanges(function () {
                window.location.href = lnk;
            }, function () {
                window.location.href = lnk;
            });
        };

        lnkDesigner.onclick = function () {
            let lnk = "designer.html";
            saveChanges(function () {
                window.location.href = lnk;
            }, function () {
                window.location.href = lnk;
            });
        };

        lnkHistory.onclick = function () {
            let lnk = "history.html";
            saveChanges(function () {
                window.location.href = lnk;
            }, function () {
                window.location.href = lnk;
            });
        };

        lnkUsers.onclick = function () {
            let lnk = "users.html";
            saveChanges(function () {
                window.location.href = lnk;
            }, function () {
                window.location.href = lnk;
            });
        };

        lnkProfiles.onclick = function () {
            let lnk = "profiles.html";
            saveChanges(function () {
                window.location.href = lnk;
            }, function () {
                window.location.href = lnk;
            });
        };

        btnLogout.onclick = function () {

            let redirect = function () {
                deleteUser();
                Common.redirectToLoginPage();
            }

            saveChanges(function () {
                redirect();
            }, function () {
                redirect();
            });
        };

        lnkAbout.onclick = function () {
            let lnk = "https://wexflow.github.io";
            saveChanges(function () {
                window.location.href = lnk;
            }, function () {
                window.location.href = lnk;
            });
        };

        lnkHelp.onclick = function () {
            let lnk = "https://github.com/aelassas/Wexflow/wiki";
            saveChanges(function () {
                window.location.href = lnk;
            }, function () {
                window.location.href = lnk;
            });
        };

        flowy(canvas, drag, release, snapping, drop);

        function loadTasks() {
            Common.get(uri + "/searchTaskNames?s=" + searchtasks.value,
                function (taskNames) {
                    let blockelements = "";
                    for (let i = 0; i < taskNames.length; i++) {
                        let taskName = taskNames[i];
                        blockelements += '<div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="' + taskName.Name + '"><input type="hidden" name="blockelemdesc" class="blockelemdesc" value="' + taskName.Description + '"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin"><div class="blockico"><span></span><img src="assets/action.svg"></div><div class="blocktext"><p class="blocktitle">' + taskName.Name + '</p><p class="blockdesc">' + taskName.Description + '</p></div></div><div class="indicator invisible" style="left: 154px; top: 100px;"></div></div>';
                    }
                    let blocklist = document.getElementById("blocklist");
                    blocklist.innerHTML = blockelements;
                },
                function () {
                    Common.toastError("An error occured while retrieving task names.");
                }, auth);
        }
        loadTasks();

        searchtasks.onkeyup = function (event) {
            event.preventDefault();
            if (event.keyCode === 13) { // Enter
                loadTasks();
            }
        };

        document.getElementById("newworkflow").onclick = function () {
            Common.get(uri + "/workflowId",
                function (res) {

                    openSavePopup = true;
                    workflowDeleted = false;
                    checkId = true;
                    flowy.deleteBlocks();
                    removeworkflow.style.display = "none";

                    document.getElementById("leftcard").style.left = -leftcardwidth + "px";
                    closecardimg.src = "assets/openleft.png";
                    leftcardHidden = true;

                    document.getElementById("wfpropwrap").style.right = "0";
                    wfclose.style.right = "311px";
                    wfpropHidden = false;
                    closewfcardimg.src = "assets/openleft.png";

                    if (rightcard === true) {
                        rightcard = false;
                        document.getElementById("properties").classList.remove("expanded");
                        setTimeout(function () {
                            document.getElementById("propwrap").classList.remove("itson");
                        }, 300);
                        if (tempblock) {
                            tempblock.classList.remove("selectedblock");
                        }
                    }

                    document.getElementById("wfid").value = res;

                    document.getElementById("wfname").value = "";
                    document.getElementById("wfdesc").value = "";
                    document.getElementById("wflaunchtype").value = "";
                    document.getElementById("wfperiod").value = "";
                    document.getElementById("wfcronexp").value = "";
                    document.getElementById("wfenabled").checked = true;
                    document.getElementById("wfapproval").checked = false;
                    document.getElementById("wfenablepj").checked = true;

                    document.getElementsByClassName("wf-local-vars")[0].innerHTML = "";

                    workflow = {
                        "WorkflowInfo": {
                            "Id": document.getElementById("wfid").value,
                            "Name": document.getElementById("wfname").value,
                            "Description": document.getElementById("wfdesc").value,
                            "LaunchType": launchTypeReverse(document.getElementById("wflaunchtype").value),
                            "Period": document.getElementById("wfperiod").value,
                            "CronExpression": document.getElementById("wfcronexp").value,
                            "IsEnabled": document.getElementById("wfenabled").checked,
                            "IsApproval": document.getElementById("wfapproval").checked,
                            "EnableParallelJobs": document.getElementById("wfenablepj").checked,
                            "LocalVariables": []
                        },
                        "Tasks": []
                    }
                    tasks = {};

                    if (json || xml || graph) {
                        document.getElementById("code-container").style.display = "none";
                        document.getElementById("blocklyArea").style.display = "none";
                        json = false;
                        xml = false;
                        graph = false;
                    }

                    leftcard.style.display = "block";
                    propwrap.style.display = "block";
                    wfclose.style.display = "block";
                    wfpropwrap.style.display = "block";
                    canvas.style.display = "block";
                    code.style.display = "none";

                    document.getElementById("leftswitch").style.backgroundColor = "#F0F0F0";
                    document.getElementById("graphswitch").style.backgroundColor = "transparent";
                    document.getElementById("middleswitch").style.backgroundColor = "transparent";
                    document.getElementById("rightswitch").style.backgroundColor = "transparent";
                    diag = true;

                },
                function () {
                    Common.toastError("An error occured while getting a new workflow id.");
                }, auth);


        };

        function addEventListenerMulti(type, listener, capture, selector) {
            let nodes = document.querySelectorAll(selector);
            for (let i = 0; i < nodes.length; i++) {
                nodes[i].addEventListener(type, listener, capture);
            }
        }

        function snapping(drag, first) {
            let grab = drag.querySelector(".grabme");
            grab.parentNode.removeChild(grab);
            let blockin = drag.querySelector(".blockin");
            blockin.parentNode.removeChild(blockin);

            let taskname = drag.querySelector(".blockelemtype").value;
            let taskdesc = drag.querySelector(".blockelemdesc").value;
            drag.innerHTML += "<div class='blockyleft'><img src='assets/actionorange.svg'><p class='blockyname'>" + taskname + "</p></div><div class='blockyright'><img src='assets/close.svg' class='removediagblock'></div><div class='blockydiv'></div><div class='blockyinfo'>" + taskdesc + "</div>";

            let index = parseInt(drag.querySelector(".blockid").value);
            if (!tasks[index]) {
                tasks[index] = {
                    "Id": 0,
                    "Name": taskname,
                    "Description": "",
                    "IsEnabled": true,
                    "Settings": []
                };
                updateTasks();
            }

            return true;
        }

        function drop(drag, blockId) {

            // rebuild blocks
            let output = flowy.output();
            let blocks = output.blocks;
            for (let i = blockId + 1; i < blocks.length; i++) {
                blocks[i].id++;
                blocks[i].parent++;
                blocks[i].data[2].value = i + 1;
            }
            // calaculate left
            let leftPos = 0;
            let cblocks = canvas.querySelectorAll(".blockelem");
            for (let i = 0; i < cblocks.length; i++) {
                let cblockId = parseInt(cblocks[i].querySelector(".blockid").value);
                if (cblockId === blockId) {
                    leftPos = parseInt(cblocks[i].style.left);
                    break;
                }
            }

            blocks.splice(blockId + 1, 0,
                {
                    "id": blockId + 1,
                    "parent": blockId,
                    "data": [
                        {
                            "name": "blockelemtype",
                            "value": drag.querySelector(".blockelemtype").value
                        },
                        {
                            "name": "blockelemdesc",
                            "value": drag.querySelector(".blockelemdesc").value
                        },
                        {
                            "name": "blockid",
                            "value": blockId + 1
                        }
                    ],
                    "attr": [
                        {
                            "class": "blockelem noselect block"
                        },
                        {
                            "style": "left: " + leftPos + "px; top: 17px;"
                        }
                    ]
                });

            // update tasks
            let length = 0;

            while (tasks[length]) {
                length++;
            }

            let taskstemp = {};
            for (let i = length - 1; i > blockId; i--) {
                taskstemp[i + 1] = tasks[i];
                tasks[i + 1] = tasks[i];
            }
            for (let i = 0; i <= blockId; i++) {
                taskstemp[i] = tasks[i];
            }
            taskstemp[blockId + 1] = {
                "Id": 0,
                "Name": drag.querySelector(".blockelemtype").value,
                "Description": "",
                "IsEnabled": true,
                "Settings": []
            };
            tasks = taskstemp;

            // update workflow
            workflow.Tasks = [];
            for (let i = 0; i < blocks.length; i++) {
                workflow.Tasks.push(tasks[parseInt(blocks[i].data[2].value)]);
            }

            // build html
            let html = "";
            let blockspace = 180;
            let arrowspace = 180;
            for (let j = 0; j < blocks.length; j++) {
                let block = blocks[j];
                let left = parseInt(block.attr[1].style.split(";")[0].replace("left:", "").replace(" ", "").replace("px", ""));
                html += "<div class='blockelem noselect block' style='left: " + left + "px; top: " + (25 + blockspace * j) + "px;'><input type='hidden' name='blockelemtype' class='blockelemtype' value='" + block.data[0].value + "'><input type='hidden' name='blockelemdesc' class='blockelemdesc' value='" + block.data[1].value + "'><input type='hidden' name='blockid' class='blockid' value='" + j + "'><div class='blockyleft'><img src='assets/actionorange.svg'><p class='blockyname'>" + (tasks[j].Id + ". " + tasks[j].Name) + "</p></div><div class='blockyright'><img class='removediagblock' src='assets/close.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>" + block.data[1].value + "</div><div class='indicator invisible' style='left: 154px; top: 100px;'></div></div>";
                if (j < blocks.length - 1) {
                    //html += "<div class='arrowblock' style='left: " + (left + 139) + "px; top: " + (125 + arrowspace * j) + "px;'><input type='hidden' class='arrowid' value='" + (j + 1) + "'><svg preserveAspectRatio='none' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M20 0L20 40L20 40L20 80' stroke='#6CA5EC' stroke-width='2px'></path><path d='M15 75H25L20 80L15 75Z' fill='#6CA5EC'></path></svg></div>";
                    html += "<div class='arrowblock' style='left: " + (left + 139) + "px; top: " + (125 + arrowspace * j) + "px;'><input type='hidden' class='arrowid' value='" + (j + 1) + "'><svg preserveAspectRatio='none' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M20 0L20 40L20 40L20 80' stroke='#6CA5EC' stroke-width='2px'></path></svg></div>";
                }
            }

            // build blockarr
            let blockarr = [];
            for (let j = 0; j < blocks.length; j++) {
                blockarr.push(
                    {
                        "parent": j - 1,
                        "childwidth": (j < blocks.length - 1 ? 318 : 0),
                        "id": j,
                        "x": output.blockarr[0].x,
                        "y": 190 + blockspace * j,
                        "width": 318,
                        "height": 100
                    });
            }

            let flowyinput = {
                "html": html,
                "blockarr": blockarr
            };

            // flowy import 
            flowy.import(flowyinput);

        }

        function drag(block) {
            block.classList.add("blockdisabled");
            tempblock2 = block;
        }

        function release() {
            if (tempblock2) {
                tempblock2.classList.remove("blockdisabled");
            }
        }

        function closeTaskSettings() {
            if (rightcard) {
                rightcard = false;
                document.getElementById("properties").classList.remove("expanded");
                setTimeout(function () {
                    document.getElementById("propwrap").classList.remove("itson");
                    wfclose.style.right = "0";
                }, 300);
                tempblock.classList.remove("selectedblock");
            }
        }

        document.getElementById("close").addEventListener("click", function () {
            closeTaskSettings();
        });

        document.getElementById("removeblock").addEventListener("click", function () {
            let confirmRes = confirm("Are you sure you want to delete all the tasks?");
            if (confirmRes === true) {
                flowy.deleteBlocks();
                closeTaskSettings();

                workflow = {
                    "WorkflowInfo": {
                        "Id": document.getElementById("wfid").value,
                        "Name": document.getElementById("wfname").value,
                        "Description": document.getElementById("wfdesc").value,
                        "LaunchType": launchTypeReverse(document.getElementById("wflaunchtype").value),
                        "Period": document.getElementById("wfperiod").value,
                        "CronExpression": document.getElementById("wfcronexp").value,
                        "IsEnabled": document.getElementById("wfenabled").checked,
                        "IsApproval": document.getElementById("wfapproval").checked,
                        "EnableParallelJobs": document.getElementById("wfenablepj").checked,
                        "LocalVariables": []
                    },
                    "Tasks": []
                }

                tasks = {};
            }
        });

        removeworkflow.addEventListener("click", function () {
            let workflowId = document.getElementById("wfid").value;
            let confirmRes = confirm("Are you sure you want to delete the workflow " + workflowId + "?");
            if (confirmRes === true) {
                Common.post(uri + "/delete?w=" + workflowId,
                    function (res) {
                        if (res === true) {
                            Common.toastSuccess("Workflow " + workflowId + " deleted with success.");
                            workflowDeleted = true;

                            flowy.deleteBlocks();
                            closeTaskSettings();

                            document.getElementById("wfid").value = "";
                            document.getElementById("wfname").value = "";
                            document.getElementById("wfdesc").value = "";
                            document.getElementById("wflaunchtype").value = "";
                            document.getElementById("wfperiod").value = "";
                            document.getElementById("wfcronexp").value = "";
                            document.getElementById("wfenabled").checked = true;
                            document.getElementById("wfapproval").checked = false;
                            document.getElementById("wfenablepj").checked = true;

                            document.getElementById("wfpropwrap").style.right = -wfpropwidth + "px";
                            wfpropHidden = true;
                            closewfcardimg.src = "assets/closeleft.png";
                            wfclose.style.right = "0";

                            document.getElementById("leftcard").style.left = -leftcardwidth + "px";
                            closecardimg.src = "assets/openleft.png";
                            leftcardHidden = true;

                            removeworkflow.style.display = "none";

                            workflow = {
                                "WorkflowInfo": {
                                    "Id": document.getElementById("wfid").value,
                                    "Name": document.getElementById("wfname").value,
                                    "Description": document.getElementById("wfdesc").value,
                                    "LaunchType": launchTypeReverse(document.getElementById("wflaunchtype").value),
                                    "Period": document.getElementById("wfperiod").value,
                                    "CronExpression": document.getElementById("wfcronexp").value,
                                    "IsEnabled": document.getElementById("wfenabled").checked,
                                    "IsApproval": document.getElementById("wfapproval").checked,
                                    "EnableParallelJobs": document.getElementById("wfenablepj").checked,
                                    "LocalVariables": []
                                },
                                "Tasks": []
                            }

                            tasks = {};

                        } else {
                            Common.toastError("An error occured while deleting the workflow" + workflowId + ".");
                        }
                    }, function () {
                        Common.toastError("An error occured while deleting the workflow" + workflowId + ".");
                    }, "", auth);
            }
        });

        let aclick = false;
        let beginTouch = function (event) {
            aclick = true;
        }
        let checkTouch = function (event) {
            aclick = false;
        }

        let doneTouch = function (event) {
            if (event.type === "mouseup") {
                updateTasks();
            }

            if (event.type === "mouseup" && aclick && event.target.closest("#canvas")) {
                if (event.target.closest(".block")) {
                    let selectedBlocks = document.getElementsByClassName("selectedblock");
                    for (let i = 0; i < selectedBlocks.length; i++) {
                        selectedBlocks[i].classList.remove("selectedblock");
                    }
                    tempblock = event.target.closest(".block");
                    rightcard = true;
                    document.getElementById("properties").classList.add("expanded");
                    document.getElementById("propwrap").classList.add("itson");
                    tempblock.classList.add("selectedblock");

                    document.getElementById("wfpropwrap").style.right = -wfpropwidth + "px";
                    wfpropHidden = true;
                    closewfcardimg.src = "assets/closeleft.png";
                    wfclose.style.right = "-60px";

                    // task settings
                    let taskname = tempblock.getElementsByClassName("blockelemtype")[0].value;

                    document.getElementById("header2").innerHTML = "Task Settings&nbsp;<span id='taskdoc' class='badge' title='Open task documentation'>doc</span>";
                    document.getElementById("taskdoc").onclick = function () {
                        let url = "https://github.com/aelassas/Wexflow/wiki/" + taskname;
                        openInNewTab(url);
                    };

                    function openInNewTab(url) {
                        let win = window.open(url, "_blank");
                        if (typeof win !== "undefined" && win !== null) {
                            win.focus();
                        }
                    }

                    let index = parseInt(event.target.closest(".block").querySelector(".blockid").value);
                    if (!tasks[index] && isNaN(index) === false) {
                        tasks[index] = {
                            "Id": 0,
                            "Name": taskname,
                            "Description": "",
                            "IsEnabled": true,
                            "Settings": []
                        };
                    }

                    document.getElementById("taskid").value = tasks[index].Id;
                    document.getElementById("taskdescription").value = tasks[index].Description;
                    document.getElementById("taskenabled").checked = tasks[index].IsEnabled;

                    updateTasks();

                    if (isNaN(index) === false) {
                        // Add setting
                        let newSettingButton = document.getElementsByClassName("wf-new-setting")[0];
                        newSettingButton.onclick = function () {
                            Common.get(uri + "/settings/" + taskname,
                                function (settings) {
                                    let settingsTable = document.getElementById("task-settings-table");

                                    let row1 = settingsTable.insertRow();
                                    let cell1_1 = row1.insertCell(0);
                                    let cell1_2 = row1.insertCell(1);

                                    let cell1Html = "<select class='form-control wf-setting-name'>";
                                    cell1Html += "<option value=''></option>";
                                    for (let i = 0; i < settings.length; i++) {
                                        let settingName = settings[i];
                                        cell1Html += "<option value='" + settingName + "'" + ">" + settingName + "</option>";
                                    }
                                    cell1Html += "</select>";
                                    cell1_1.innerHTML = cell1Html;

                                    cell1_2.innerHTML = '<button type="button" class="wf-remove-setting btn btn-danger">Delete</button>';

                                    let row2 = settingsTable.insertRow();
                                    let cell2_1 = row2.insertCell(0);

                                    let sIndex = tasks[index].Settings.length;
                                    cell2_1.innerHTML = '<input class="wf-setting-index" type="hidden" value="' + sIndex + '"><input class="form-control wf-setting-value" value="" type="text" />';
                                    cell2_1.colSpan = 2;

                                    // Bind onchange
                                    tasks[index].Settings.push({
                                        "Name": "",
                                        "Value": "",
                                        "Attributes": []
                                    });

                                    let settingNameSelect = settingsTable.getElementsByClassName("wf-setting-name")[sIndex];
                                    settingNameSelect.onchange = function () {
                                        tasks[index].Settings[sIndex].Name = this.value;
                                        return false;
                                    }

                                    // Bind onkeyup events
                                    let settingValueInput = settingsTable.getElementsByClassName("wf-setting-value")[sIndex];
                                    settingValueInput.onkeyup = function () {
                                        if (tasks[index].Settings[sIndex]) {
                                            // Calculate index from DOM
                                            let innerIndex = parseInt(this.parentNode.querySelector(".wf-setting-index").value);
                                            tasks[index].Settings[innerIndex].Value = this.value;
                                        }
                                        return false;
                                    }

                                    // Bind remove event
                                    let deleteButton = settingsTable.getElementsByClassName("wf-remove-setting")[sIndex];
                                    deleteButton.onclick = function () {
                                        let res = confirm("Are you sure you want to remove this setting?");
                                        if (res === true) {
                                            // Calculate index from DOM
                                            let innerIndex = parseInt(this.parentNode.parentNode.nextSibling.querySelector(".wf-setting-index").value);
                                            tasks[index].Settings = deleteRow(tasks[index].Settings, innerIndex);
                                            // update indexes
                                            let indexes = this.parentNode.parentNode.parentNode.querySelectorAll(".wf-setting-index");
                                            for (let i = innerIndex; i < indexes.length; i++) {
                                                indexes[i].value = parseInt(indexes[i].value) - 1;
                                            }
                                            this.parentNode.parentNode.nextSibling.remove();
                                            this.parentNode.parentNode.remove();
                                        }
                                        return false;
                                    }

                                    goToBottom("proplist");
                                }, function () {
                                    Common.toastError("An error occured while retrieving settings.");
                                }, auth);

                            return false;
                        };

                        if (checkId === true) {
                            Common.get(uri + "/settings/" + taskname,
                                function (defaultSettings) {

                                    if (tasks[index]) {

                                        if (defaultSettings.length > 0) {
                                            newSettingButton.style.display = "inline-block";
                                        } else {
                                            newSettingButton.style.display = "none";
                                        }

                                        let settings = tasks[index].Settings;
                                        let taskSettings = "";

                                        // Add non empty settings
                                        for (let i = 0; i < settings.length; i++) {
                                            let settingName = settings[i].Name;
                                            let settingValue = settings[i].Value;

                                            taskSettings += "<tr>";
                                            taskSettings += "<td>";
                                            taskSettings += '<p class="wf-setting-name">' + settingName + "</p>";
                                            taskSettings += "</td>";
                                            taskSettings += "<td>";
                                            taskSettings += '<button type="button" class="wf-remove-setting btn btn-danger">Delete</button>';
                                            taskSettings += "</td>";
                                            taskSettings += "</tr>";
                                            taskSettings += "<tr>";
                                            taskSettings += "<td colspan='2'>";
                                            taskSettings += '<input class="wf-setting-index" type="hidden" value="' + i + '"><input class="form-control wf-setting-value" value="' + settingValue + '" type="text" />';
                                            taskSettings += "</td>";
                                            taskSettings += "</tr>";
                                        }

                                        document.getElementById("task-settings-table").innerHTML = taskSettings;

                                        document.getElementById("taskid").value = tasks[index].Id;
                                        document.getElementById("taskdescription").value = tasks[index].Description;
                                        document.getElementById("taskenabled").checked = tasks[index].IsEnabled;

                                        // Remove setting
                                        let deleteButtons = document.getElementsByClassName("wf-remove-setting");
                                        for (let i = 0; i < deleteButtons.length; i++) {
                                            let deleteButton = deleteButtons[i];
                                            deleteButton.onclick = function () {
                                                // Calculate index from DOM
                                                let res = confirm("Are you sure you want to remove this setting?");
                                                if (res === true) {
                                                    let innerIndex = parseInt(this.parentNode.parentNode.nextSibling.querySelector(".wf-setting-index").value);
                                                    tasks[index].Settings = deleteRow(tasks[index].Settings, innerIndex);
                                                    // update indexes
                                                    let indexes = this.parentNode.parentNode.parentNode.querySelectorAll(".wf-setting-index");
                                                    for (let i = innerIndex; i < indexes.length; i++) {
                                                        indexes[i].value = parseInt(indexes[i].value) - 1;
                                                    }
                                                    this.parentNode.parentNode.nextSibling.remove();
                                                    this.parentNode.parentNode.remove();
                                                }
                                                return false;
                                            };
                                        }

                                        document.getElementById("taskid").onkeyup = function () {
                                            tasks[index].Id = parseInt(this.value);

                                            updateTasks();

                                            // update blockelem name
                                            if (tempblock) {
                                                tempblock.getElementsByClassName("blockyname")[0].innerHTML = tasks[index].Id + ". " + tasks[index].Name;
                                            }
                                        };

                                        document.getElementById("taskdescription").onkeyup = function () {
                                            tasks[index].Description = this.value;

                                            updateTasks();

                                            // update blockelem description
                                            if (tempblock) {
                                                tempblock.getElementsByClassName("blockyinfo")[0].innerHTML = this.value;
                                            }
                                        };

                                        document.getElementById("taskenabled").onchange = function () {
                                            tasks[index].IsEnabled = this.checked;

                                            updateTasks();
                                        };

                                        let settingValues = document.getElementsByClassName("wf-setting-value");
                                        for (let i = 0; i < settingValues.length; i++) {
                                            let settingValue = settingValues[i];

                                            settingValue.onkeyup = function () {
                                                let sindex = this.previousElementSibling.value;
                                                tasks[index].Settings[sindex].Value = this.value;
                                                updateTasks();
                                            };
                                        }
                                    }
                                },
                                function () {
                                    Common.toastError("An error occured while retrieving settings.");
                                }, auth);
                        } else {
                            Common.get(uri + "/settings/" + taskname,
                                function (defaultSettings) {

                                    if (tasks[index]) {
                                        let settings = tasks[index].Settings;
                                        let taskSettings = "";

                                        if (defaultSettings.length > 0) {
                                            newSettingButton.style.display = "inline-block";
                                        } else {
                                            newSettingButton.style.display = "none";
                                        }

                                        // Add task settings
                                        for (let i = 0; i < settings.length; i++) {
                                            let settingName = settings[i].Name;
                                            let settingValue = settings[i].Value;

                                            taskSettings += "<tr>";
                                            taskSettings += "<td>";
                                            taskSettings += '<p class="wf-setting-name">' + settingName + "</p>";
                                            taskSettings += "</td>";
                                            taskSettings += "<td>";
                                            taskSettings += '<button type="button" class="wf-remove-setting btn btn-danger">Delete</button>';
                                            taskSettings += "</td>";
                                            taskSettings += "</tr>";
                                            taskSettings += "<tr>";
                                            taskSettings += "<td colspan='2'>";
                                            taskSettings += '<input class="wf-setting-index" type="hidden" value="' + i + '"><input class="form-control wf-setting-value" value="' + settingValue + '" type="text" />';
                                            taskSettings += "</td>";
                                            taskSettings += "</tr>";
                                        }

                                        document.getElementById("task-settings-table").innerHTML = taskSettings;

                                        // Bind onkeyup
                                        let settingValues = document.getElementsByClassName("wf-setting-value");
                                        for (let i = 0; i < settingValues.length; i++) {
                                            let settingValue = settingValues[i];

                                            settingValue.onkeyup = function () {
                                                let sindex = this.previousElementSibling.value;
                                                tasks[index].Settings[sindex].Value = this.value;
                                                updateTasks();
                                            };
                                        }

                                        // Bind onremove
                                        let deleteButtons = document.getElementsByClassName("wf-remove-setting");
                                        for (let i = 0; i < deleteButtons.length; i++) {
                                            let deleteButton = deleteButtons[i];
                                            deleteButton.onclick = function () {
                                                let res = confirm("Are you sure you want to remove this setting?");
                                                if (res === true) {
                                                    // Calculate index from DOM
                                                    let innerIndex = parseInt(this.parentNode.parentNode.nextSibling.querySelector(".wf-setting-index").value);
                                                    tasks[index].Settings = deleteRow(tasks[index].Settings, innerIndex);
                                                    // update indexes
                                                    let indexes = this.parentNode.parentNode.parentNode.querySelectorAll(".wf-setting-index");
                                                    for (let i = innerIndex; i < indexes.length; i++) {
                                                        indexes[i].value = parseInt(indexes[i].value) - 1;
                                                    }
                                                    this.parentNode.parentNode.nextSibling.remove();
                                                    this.parentNode.parentNode.remove();
                                                }
                                                return false;
                                            };
                                        }

                                        document.getElementById("taskid").onkeyup = function () {
                                            tasks[index].Id = parseInt(this.value);

                                            updateTasks();

                                            // update blockelem name
                                            if (tempblock) {
                                                tempblock.getElementsByClassName("blockyname")[0].innerHTML = tasks[index].Id + ". " + tasks[index].Name;
                                            }
                                        };

                                        document.getElementById("taskdescription").onkeyup = function () {
                                            tasks[index].Description = this.value;

                                            updateTasks();

                                            // update blockelem description
                                            if (tempblock) {
                                                tempblock.getElementsByClassName("blockyinfo")[0].innerHTML = this.value;
                                            }
                                        };

                                        document.getElementById("taskenabled").onchange = function () {
                                            tasks[index].IsEnabled = this.checked;

                                            updateTasks();
                                        };

                                    }
                                },
                                function () {
                                    Common.toastError("An error occured while retrieving settings.");
                                }, auth);

                        }
                    }
                }
            }
        }
        addEventListener("mousedown", beginTouch, false);
        addEventListener("mousemove", checkTouch, false);
        addEventListener("mouseup", doneTouch, false);
        addEventListenerMulti("touchstart", beginTouch, false, ".block");

        document.getElementById("closecard").onclick = function () {
            let blockelems = canvas.getElementsByClassName("blockelem");
            let arrowblocks = canvas.getElementsByClassName("arrowblock");

            if (leftcardHidden === false) {

                document.getElementById("leftcard").style.left = -leftcardwidth + "px";
                document.getElementById("leftcard").style.transition = transition;
                closecardimg.src = "assets/openleft.png";
                leftcardHidden = true;
                canvas.style.left = "0";
                canvas.style.width = "100%";

                for (let i = 0; i < blockelems.length; i++) {
                    let blockelm = blockelems[i];
                    blockelm.style.left = (blockelm.offsetLeft + leftcardwidth) + "px";
                }

                for (let i = 0; i < arrowblocks.length; i++) {
                    let arrowblock = arrowblocks[i];
                    arrowblock.style.left = (arrowblock.offsetLeft + leftcardwidth) + "px";
                }
            } else {

                document.getElementById("leftcard").style.left = "0";
                closecardimg.src = "assets/closeleft.png";
                leftcardHidden = false;
                canvas.style.left = leftcardwidth + "px";
                canvas.style.width = "calc(100% - " + leftcardwidth + "px)";

                for (let i = 0; i < blockelems.length; i++) {
                    let blockelm = blockelems[i];
                    blockelm.style.left = (blockelm.offsetLeft - leftcardwidth) + "px";
                }

                for (let i = 0; i < arrowblocks.length; i++) {
                    let arrowblock = arrowblocks[i];
                    arrowblock.style.left = (arrowblock.offsetLeft - leftcardwidth) + "px";
                }

                document.getElementById("searchtasks").focus();
                document.getElementById("searchtasks").select();
            }
        };


        wfclose.onclick = function () {
            if (wfpropHidden === false) {
                document.getElementById("wfpropwrap").style.right = -wfpropwidth + "px";
                document.getElementById("wfpropwrap").style.transition = transition;
                wfclose.style.right = "0";
                wfclose.style.transition = transition;
                wfpropHidden = true;
                closewfcardimg.src = "assets/closeleft.png";
            } else {
                document.getElementById("wfpropwrap").style.right = "0";
                wfclose.style.right = "311px";
                wfpropHidden = false;
                closewfcardimg.src = "assets/openleft.png";

            }
        };

        // CTRL+S, CTRL+O
        let workflow = {
            "WorkflowInfo": {
                "Id": document.getElementById("wfid").value,
                "Name": document.getElementById("wfname").value,
                "Description": document.getElementById("wfdesc").value,
                "LaunchType": launchTypeReverse(document.getElementById("wflaunchtype").value),
                "Period": document.getElementById("wfperiod").value,
                "CronExpression": document.getElementById("wfcronexp").value,
                "IsEnabled": document.getElementById("wfenabled").checked,
                "IsApproval": document.getElementById("wfapproval").checked,
                "EnableParallelJobs": document.getElementById("wfenablepj").checked,
                "LocalVariables": []
            },
            "Tasks": []
        }
        let diag = true;
        let graph = false;
        let json = false;
        let xml = false;

        document.getElementById("wfid").onkeyup = function () {
            workflow.WorkflowInfo.Id = this.value;
        };
        document.getElementById("wfname").onkeyup = function () {
            workflow.WorkflowInfo.Name = this.value;
        };
        document.getElementById("wfdesc").onkeyup = function () {
            workflow.WorkflowInfo.Description = this.value;
        };
        document.getElementById("wflaunchtype").onchange = function () {
            workflow.WorkflowInfo.LaunchType = launchTypeReverse(this.value);
        };
        document.getElementById("wfperiod").onkeyup = function () {
            workflow.WorkflowInfo.Period = this.value;
        };
        document.getElementById("wfcronexp").onkeyup = function () {
            workflow.WorkflowInfo.CronExpression = this.value;
        };
        document.getElementById("wfenabled").onchange = function () {
            workflow.WorkflowInfo.IsEnabled = this.checked;
        };
        document.getElementById("wfapproval").onchange = function () {
            workflow.WorkflowInfo.IsApproval = this.checked;
        };
        document.getElementById("wfenablepj").onchange = function () {
            workflow.WorkflowInfo.EnableParallelJobs = this.checked;
        };

        // main function for updating tasks
        function updateTasks() {
            let output = flowy.output();
            if (output) {
                let blocks = output.blocks;

                // update tasks
                let length = 0;

                while (tasks[length]) {
                    length++;
                }

                // if task index is not in the diagram then remove the corresponding task from tasks
                for (let i = 0; i < length; i++) {
                    let taskFound = false;
                    for (let j = 0; j < blocks.length; j++) {
                        let index = parseInt(blocks[j].data[2].value);
                        if (index === i) {
                            taskFound = true;
                            break;
                        }
                    }
                    if (taskFound === false) {
                        tasks[i] = null;
                    }
                }

                // add missing tasks
                for (let i = 0; i < blocks.length; i++) {
                    if (!tasks[i]) {
                        tasks[i] = {
                            "Id": 0,
                            "Name": blocks[i].data[0].value,
                            "Description": "",
                            "IsEnabled": true,
                            "Settings": []
                        };
                    }
                }

                // update workflow
                workflow.Tasks = [];
                for (let i = 0; i < blocks.length; i++) {
                    workflow.Tasks.push(tasks[parseInt(blocks[i].data[2].value)]);
                }

                // bind remove block
                let removeButtons = document.getElementsByClassName("removediagblock");
                for (let i = 0; i < removeButtons.length; i++) {
                    let removeButton = removeButtons[i];
                    removeButton.onclick = function () {
                        let blockid = parseInt(this.closest(".block").querySelector(".blockid").value);
                        let taskName = blocks[blockid].data[0].value;

                        let res = confirm("Are you sure you want to delete the task " + taskName + "?");

                        if (res === true) {

                            // update tasks
                            for (let i = blockid; i < blocks.length; i++) {
                                if (i + 1 < blocks.length) {
                                    tasks[i] = tasks[i + 1];
                                } else {
                                    tasks[i] = null;
                                }
                            }

                            // build blocks
                            blocks.splice(blockid, 1);

                            // update workflow
                            workflow.Tasks = [];
                            for (let i = 0; i < blocks.length; i++) {
                                workflow.Tasks.push(tasks[parseInt(blocks[i].data[2].value)]);
                            }

                            // build html
                            let html = "";
                            let blockspace = 180;
                            let arrowspace = 180;
                            for (let j = 0; j < blocks.length; j++) {
                                let block = blocks[j];
                                let left = parseInt(block.attr[1].style.split(";")[0].replace("left:", "").replace(" ", "").replace("px", ""));
                                html += "<div class='blockelem noselect block' style='left: " + left + "px; top: " + (25 + blockspace * j) + "px;'><input type='hidden' name='blockelemtype' class='blockelemtype' value='" + block.data[0].value + "'><input type='hidden' name='blockelemdesc' class='blockelemdesc' value='" + block.data[1].value + "'><input type='hidden' name='blockid' class='blockid' value='" + j + "'><div class='blockyleft'><img src='assets/actionorange.svg'><p class='blockyname'>" + (tasks[j].Id + ". " + tasks[j].Name) + "</p></div><div class='blockyright'><img class='removediagblock' src='assets/close.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>" + block.data[1].value + "</div><div class='indicator invisible' style='left: 154px; top: 100px;'></div></div>";
                                if (j < blocks.length - 1) {
                                    //html += "<div class='arrowblock' style='left: " + (left + 139) + "px; top: " + (125 + arrowspace * j) + "px;'><input type='hidden' class='arrowid' value='" + (j + 1) + "'><svg preserveAspectRatio='none' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M20 0L20 40L20 40L20 80' stroke='#6CA5EC' stroke-width='2px'></path><path d='M15 75H25L20 80L15 75Z' fill='#6CA5EC'></path></svg></div>";
                                    html += "<div class='arrowblock' style='left: " + (left + 139) + "px; top: " + (125 + arrowspace * j) + "px;'><input type='hidden' class='arrowid' value='" + (j + 1) + "'><svg preserveAspectRatio='none' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M20 0L20 40L20 40L20 80' stroke='#6CA5EC' stroke-width='2px'></path></svg></div>";
                                }
                            }

                            // build blockarr
                            let blockarr = [];
                            for (let j = 0; j < blocks.length; j++) {
                                blockarr.push(
                                    {
                                        "parent": j - 1,
                                        "childwidth": (j < blocks.length - 1 ? 318 : 0),
                                        "id": j,
                                        "x": output.blockarr[0].x,
                                        "y": 190 + blockspace * j,
                                        "width": 318,
                                        "height": 100
                                    });
                            }

                            let flowyinput = {
                                "html": html,
                                "blockarr": blockarr
                            };

                            // flowy import 
                            flowy.import(flowyinput);

                            // close propwrap
                            rightcard = false;
                            document.getElementById("properties").classList.remove("expanded");
                            setTimeout(function () {
                                document.getElementById("propwrap").classList.remove("itson");
                                wfclose.style.right = "0";
                            }, 0);

                        } else {
                            // close propwrap
                            rightcard = false;
                            document.getElementById("properties").classList.remove("expanded");
                            setTimeout(function () {
                                document.getElementById("propwrap").classList.remove("itson");
                                wfclose.style.right = "0";
                            }, 0);

                            let selectedBlock = document.getElementsByClassName("selectedblock")[0];
                            if (selectedBlock) {
                                selectedBlock.classList.remove("selectedblock");
                            }
                        }


                    };
                }

            }
        }

        window.onkeydown = function (event) {
            if ((event.ctrlKey || event.metaKey || event.keyCode === 17 || event.keyCode === 224 || event.keyCode === 91 || event.keyCode === 93) && event.keyCode === 83) {
                event.preventDefault();
                let wfid = document.getElementById("wfid").value;

                if (diag === true) {
                    updateTasks();

                    let saveFunc = function () {
                        Common.post(uri + "/save", function (res) {
                            if (res === true) {
                                initialWorkflow = JSON.parse(JSON.stringify(workflow));
                                checkId = false;
                                openSavePopup = false;
                                removeworkflow.style.display = "block";
                                jsonEditorChanged = false;
                                xmlEditorChanged = false;
                                Common.toastSuccess("workflow " + wfid + " saved and loaded with success from diagram view.");
                            } else {
                                Common.toastError("An error occured while saving the workflow " + wfid + " from diagram view.");
                            }
                        }, function () {
                            Common.toastError("An error occured while saving the workflow " + wfid + " from diagram view.");
                        }, workflow, auth);
                    };

                    let wfIdStr = document.getElementById("wfid").value;
                    if (isInt(wfIdStr)) {
                        let workflowId = parseInt(wfIdStr);

                        if (checkId === true) {
                            Common.get(uri + "/isWorkflowIdValid/" + workflowId,
                                function (res) {
                                    if (res === true) {
                                        if (document.getElementById("wfname").value === "") {
                                            Common.toastInfo("Enter a name for this workflow.");
                                        } else {
                                            let lt = document.getElementById("wflaunchtype").value;
                                            if (lt === "") {
                                                Common.toastInfo("Select a launchType for this workflow.");
                                            } else {
                                                if (lt === "periodic" && document.getElementById("wfperiod").value === "") {
                                                    Common.toastInfo("Enter a period for this workflow.");
                                                } else {
                                                    if (lt === "cron" && document.getElementById("wfcronexp").value === "") {
                                                        Common.toastInfo("Enter a cron expression for this workflow.");
                                                    } else {

                                                        // Period validation
                                                        if (lt === "periodic" && document.getElementById("wfperiod").value !== "") {
                                                            let period = document.getElementById("wfperiod").value;
                                                            Common.get(uri + "/isPeriodValid/" + period,
                                                                function (res) {
                                                                    if (res === true) {
                                                                        saveFunc();
                                                                    } else {
                                                                        Common.toastInfo("The period format is not valid. The valid format is: dd.hh:mm:ss");
                                                                    }
                                                                },
                                                                function () { }, auth
                                                            );
                                                        } // Cron expression validation
                                                        else if (lt === "cron" && document.getElementById("wfcronexp").value !== "") {
                                                            let expression = document.getElementById("wfcronexp").value;
                                                            let expressionEncoded = encodeURIComponent(expression);

                                                            Common.get(uri + "/isCronExpressionValid?e=" + expressionEncoded,
                                                                function (res) {
                                                                    if (res === true) {
                                                                        saveFunc();
                                                                    } else {
                                                                        if (confirm("The cron expression format is not valid.\nRead the documentation?")) {
                                                                            openInNewTab("https://github.com/aelassas/Wexflow/wiki/Cron-scheduling");
                                                                        }
                                                                    }
                                                                },
                                                                function () { }, auth
                                                            );
                                                        } else {
                                                            saveFunc();
                                                        }

                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        Common.toastInfo("The workflow id is already in use. Enter another one.");
                                    }
                                },
                                function () { }, auth
                            );
                        } else {

                            if (document.getElementById("wfname").value === "") {
                                Common.toastInfo("Enter a name for this workflow.");
                            } else {
                                let lt = document.getElementById("wflaunchtype").value;
                                if (lt === "") {
                                    Common.toastInfo("Select a launchType for this workflow.");
                                } else {
                                    if (lt === "periodic" && document.getElementById("wfperiod").value === "") {
                                        Common.toastInfo("Enter a period for this workflow.");
                                    } else {
                                        if (lt === "cron" && document.getElementById("wfcronexp").value === "") {
                                            Common.toastInfo("Enter a cron expression for this workflow.");
                                        } else {

                                            // Period validation
                                            if (lt === "periodic" && document.getElementById("wfperiod").value !== "") {
                                                let period = document.getElementById("wfperiod").value;
                                                Common.get(uri + "/isPeriodValid/" + period,
                                                    function (res) {
                                                        if (res === true) {
                                                            saveFunc();
                                                        } else {
                                                            Common.toastInfo("The period format is not valid. The valid format is: dd.hh:mm:ss");
                                                        }
                                                    },
                                                    function () { }, auth
                                                );
                                            } // Cron expression validation
                                            else if (lt === "cron" && document.getElementById("wfcronexp").value !== "") {
                                                let expression = document.getElementById("wfcronexp").value;
                                                let expressionEncoded = encodeURIComponent(expression);

                                                Common.get(uri + "/isCronExpressionValid?e=" + expressionEncoded,
                                                    function (res) {
                                                        if (res === true) {
                                                            saveFunc();
                                                        } else {
                                                            if (confirm("The cron expression format is not valid.\nRead the documentation?")) {
                                                                openInNewTab("https://github.com/aelassas/Wexflow/wiki/Cron-scheduling");
                                                            }
                                                        }
                                                    },
                                                    function () { }, auth
                                                );
                                            } else {
                                                saveFunc();
                                            }

                                        }
                                    }
                                }
                            }

                        }

                    } else {
                        Common.toastInfo("Enter a valid workflow id.");
                    }

                } else if (json === true) {
                    let json = JSON.parse(editor.getValue());
                    Common.post(uri + "/save", function (res) {
                        if (res === true) {
                            checkId = false;
                            openSavePopup = false;
                            loadDiagram(workflow.WorkflowInfo.Id);
                            initialWorkflow = JSON.parse(JSON.stringify(workflow));
                            removeworkflow.style.display = "block";
                            jsonEditorChanged = false;
                            Common.toastSuccess("workflow " + wfid + " saved and loaded with success from JSON view.");
                        } else {
                            Common.toastError("An error occured while saving the workflow " + wfid + " from JSON view.");
                        }
                    }, function () {
                        Common.toastError("An error occured while saving the workflow " + wfid + " from JSON view.");
                    }, json, auth);
                } else if (xml === true) {
                    let json = {
                        workflowId: workflow.WorkflowInfo.Id,
                        xml: editor.getValue()
                    };
                    Common.post(uri + "/saveXml", function (res) {
                        if (res === true) {
                            checkId = false;
                            openSavePopup = false;
                            loadDiagram(workflow.WorkflowInfo.Id);
                            initialWorkflow = JSON.parse(JSON.stringify(workflow));
                            removeworkflow.style.display = "block";
                            xmlEditorChanged = false;
                            Common.toastSuccess("workflow " + wfid + " saved and loaded with success from XML view.");
                        } else {
                            Common.toastError("An error occured while saving the workflow " + wfid + " from XML view.");
                        }
                    }, function () {
                        Common.toastError("An error occured while saving the workflow " + wfid + " from XML view.");
                    }, json, auth);
                }

                return false;
            }
            else if ((event.ctrlKey || event.metaKey || event.keyCode === 17 || event.keyCode === 224 || event.keyCode === 91 || event.keyCode === 93) && event.keyCode === 79) {
                event.preventDefault();
                browse();
                return false;
            }
        };

        function launchTypeReverse(lt) {
            switch (lt) {
                case "startup":
                    return 0;
                case "trigger":
                    return 1;
                case "periodic":
                    return 2;
                case "cron":
                    return 3;
                default:
                    return -1;
            }
        }

        function launchType(lt) {
            switch (lt) {
                case 0:
                    return "startup";
                case 1:
                    return "trigger";
                case 2:
                    return "periodic";
                case 3:
                    return "cron";
                default:
                    return "";
            }
        }

        function isInt(str) {
            return /^\+?(0|[1-9]\d*)$/.test(str);
        }

        // diagram click
        document.getElementById("leftswitch").onclick = function () {
            diag = true;
            graph = false;
            json = false;
            xml = false;

            leftcard.style.display = "block";
            propwrap.style.display = "block";
            wfclose.style.display = "block";
            wfpropwrap.style.display = "block";
            canvas.style.display = "block";
            code.style.display = "none";
            document.getElementById("blocklyArea").style.display = "none";

            this.style.backgroundColor = "#F0F0F0";
            document.getElementById("graphswitch").style.backgroundColor = "transparent";
            document.getElementById("middleswitch").style.backgroundColor = "transparent";
            document.getElementById("rightswitch").style.backgroundColor = "transparent";

        };

        // graph click

        function openGraph(workflowId) {
            // task
            let taskJson = {
                "message0": "Task %1",
                "args0": [
                    { "type": "field_number", "name": "TASK", "check": "Number" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 230
            };

            Blockly.Blocks['task'] = {
                init: function () {
                    this.jsonInit(taskJson);
                    let thisBlock = this;
                    this.setTooltip(function () {
                        let taskId = parseInt(thisBlock.getFieldValue('TASK'));
                        let taskName = "";
                        let taskDesc = "";

                        for (let i = 0; i < workflow.Tasks.length; i++) {
                            let task = workflow.Tasks[i];
                            if (task.Id === taskId) {
                                taskName = task.Name;
                                taskDesc = task.Description;
                                break;
                            }
                        }
                        return 'Task %1'.replace('%1', taskId) + " - " + taskName + " - " + taskDesc;
                    });
                }
            };

            // if
            let ifJson = {
                "message0": "If %1 Do %2 Else %3",
                "args0": [
                    { "type": "field_number", "name": "IF", "check": "Number" },
                    { "type": "input_statement", "name": "DO" },
                    { "type": "input_statement", "name": "ELSE" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 160
            };

            Blockly.Blocks['if'] = {
                init: function () {
                    this.jsonInit(ifJson);
                    let thisBlock = this;
                    this.setTooltip(function () {
                        let taskId = parseInt(thisBlock.getFieldValue('IF'));
                        let taskName = "";
                        let taskDesc = "";

                        for (let i = 0; i < workflow.Tasks.length; i++) {
                            let task = workflow.Tasks[i];
                            if (task.Id === taskId) {
                                taskName = task.Name;
                                taskDesc = task.Description;
                                break;
                            }
                        }

                        return 'If(%1)'.replace('%1', taskId) + " - " + taskName + " - " + taskDesc;
                    });
                }
            };

            // while
            let whileJson = {
                "message0": "While %1 %2",
                "args0": [
                    { "type": "field_number", "name": "WHILE", "check": "Number" },
                    { "type": "input_statement", "name": "DO" },
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 160
            };

            Blockly.Blocks['while'] = {
                init: function () {
                    this.jsonInit(whileJson);
                    let thisBlock = this;
                    this.setTooltip(function () {
                        let taskId = parseInt(thisBlock.getFieldValue('WHILE'));
                        let taskName = "";
                        let taskDesc = "";

                        for (let i = 0; i < workflow.Tasks.length; i++) {
                            let task = workflow.Tasks[i];
                            if (task.Id === taskId) {
                                taskName = task.Name;
                                taskDesc = task.Description;
                                break;
                            }
                        }
                        return 'While(%1)'.replace('%1', taskId) + " - " + taskName + " - " + taskDesc;
                    });
                }
            };

            // switch/case
            let caseJson = {
                "message0": "Case %1 %2",
                "args0": [
                    { "type": "field_input", "name": "CASE_VALUE" },
                    { "type": "input_statement", "name": "CASE" },
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 160
            };

            Blockly.Blocks['case'] = {
                init: function () {
                    this.jsonInit(caseJson);
                    let thisBlock = this;
                    this.setTooltip(function () {
                        return 'Case "%1"'.replace('%1', thisBlock.getFieldValue('CASE_VALUE'));
                    });
                }
            };

            let switchJson = {
                "message0": "Switch %1 %2 Default %3",
                "args0": [
                    { "type": "field_number", "name": "SWITCH", "check": "Number" },
                    { "type": "input_statement", "name": "CASE" },
                    { "type": "input_statement", "name": "DEFAULT" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 160
            };

            Blockly.Blocks['switch'] = {
                init: function () {
                    this.jsonInit(switchJson);
                    let thisBlock = this;
                    this.setTooltip(function () {
                        let taskId = parseInt(thisBlock.getFieldValue('SWITCH'));
                        let taskName = "";
                        let taskDesc = "";

                        for (let i = 0; i < workflow.Tasks.length; i++) {
                            let task = workflow.Tasks[i];
                            if (task.Id === taskId) {
                                taskName = task.Name;
                                taskDesc = task.Description;
                                break;
                            }
                        }
                        return 'Switch(%1)'.replace('%1', taskId) + " - " + taskName + " - " + taskDesc;
                    });
                }
            };

            // onSuccess
            let onSuccessJson = {
                "message0": "OnSuccess %1",
                "args0": [
                    { "type": "input_statement", "name": "ON_SUCCESS" },
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 60
            };

            Blockly.Blocks['onSuccess'] = {
                init: function () {
                    this.jsonInit(onSuccessJson);
                    this.setTooltip(function () {
                        return 'OnSuccess';
                    });
                }
            };

            // onWarning
            let onWarningJson = {
                "message0": "OnWarning %1",
                "args0": [
                    { "type": "input_statement", "name": "ON_WARNING" },
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 60
            };

            Blockly.Blocks['onWarning'] = {
                init: function () {
                    this.jsonInit(onWarningJson);
                    this.setTooltip(function () {
                        return 'OnWarning';
                    });
                }
            };

            // onError
            let onErrorJson = {
                "message0": "OnError %1",
                "args0": [
                    { "type": "input_statement", "name": "ON_ERROR" },
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 60
            };

            Blockly.Blocks['onError'] = {
                init: function () {
                    this.jsonInit(onErrorJson);
                    this.setTooltip(function () {
                        return 'OnError';
                    });
                }
            };

            // onRejected
            let onRejectedJson = {
                "message0": "OnRejected %1",
                "args0": [
                    { "type": "input_statement", "name": "ON_REJECTED" },
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": 60
            };

            Blockly.Blocks['onRejected'] = {
                init: function () {
                    this.jsonInit(onRejectedJson);
                    this.setTooltip(function () {
                        return 'OnRejected';
                    });
                }
            };

            if (checkId === false) {
                Common.get(uri + "/graphBlockly/" + workflowId, function (blocklyXml) {
                    let blocklyArea = document.getElementById('blocklyArea');
                    let blocklyDiv = document.getElementById('blocklyDiv');
                    blocklyDiv.innerHTML = "";
                    let workspace = Blockly.inject(blocklyDiv, { toolbox: document.getElementById('toolbox'), grid: { spacing: 20, length: 3, colour: '#ccc', snap: true }, trashcan: true, scrollbars: true, sounds: false, zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 } });
                    workspace.options.readOnly = true;
                    let xml_text = Blockly.Xml.textToDom(blocklyXml);
                    Blockly.Xml.domToWorkspace(xml_text, workspace);

                    graph = true;
                    diag = false;
                    json = false;
                    xml = false;

                    leftcard.style.display = "none";
                    propwrap.style.display = "none";
                    wfclose.style.display = "none";
                    wfpropwrap.style.display = "none";
                    canvas.style.display = "none";
                    code.style.display = "none";
                    document.getElementById("blocklyArea").style.display = "block";

                    document.getElementById("graphswitch").style.backgroundColor = "#F0F0F0";
                    document.getElementById("leftswitch").style.backgroundColor = "transparent";
                    document.getElementById("middleswitch").style.backgroundColor = "transparent";
                    document.getElementById("rightswitch").style.backgroundColor = "transparent";


                    let onresize = function (e) {
                        // Compute the absolute coordinates and dimensions of blocklyArea.
                        let element = blocklyArea;
                        let x = 0;
                        let y = 0;
                        do {
                            x += element.offsetLeft;
                            y += element.offsetTop;
                            element = element.offsetParent;
                        } while (element);
                        // Position blocklyDiv over blocklyArea.
                        blocklyDiv.style.left = x + 'px';
                        blocklyDiv.style.top = y + 'px';
                        blocklyDiv.style.top = 0;
                        blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
                        blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
                        Blockly.svgResize(workspace);
                    };
                    window.addEventListener('resize', onresize, false);
                    onresize();
                    Blockly.svgResize(workspace);
                }, function () {
                    Common.toastInfo("An error occurred while retrieving the graph.");
                }, auth);

            } else {
                Common.toastInfo("You must save the workflow to view the graph.");
            }
        }

        document.getElementById("graphswitch").onclick = function () {
            let wfid = document.getElementById("wfid").value;
            if (isInt(wfid)) {
                let workflowId = parseInt(wfid);
                openGraph(workflowId);
            } else {
                Common.toastInfo("Enter a valid workflow id.");
            }
        };

        // json click
        function openJsonView(jsonVal) {
            diag = false;
            graph = false;
            json = true;
            xml = false;

            jsonEditorChanged = false;

            leftcard.style.display = "none";
            propwrap.style.display = "none";
            wfclose.style.display = "none";
            wfpropwrap.style.display = "none";
            canvas.style.display = "none";
            document.getElementById("blocklyArea").style.display = "none";
            code.style.display = "block";

            document.getElementById("middleswitch").style.backgroundColor = "#F0F0F0";
            document.getElementById("graphswitch").style.backgroundColor = "transparent";
            document.getElementById("leftswitch").style.backgroundColor = "transparent";
            document.getElementById("rightswitch").style.backgroundColor = "transparent";

            editor = ace.edit("code");
            editor.setOptions({
                maxLines: Infinity,
                autoScrollEditorIntoView: true
            });

            editor.setReadOnly(false);
            editor.setFontSize("100%");
            editor.setPrintMarginColumn(false);
            editor.setTheme("ace/theme/github");
            editor.getSession().setMode("ace/mode/json");


            editor.commands.addCommand({
                name: "showKeyboardShortcuts",
                bindKey: { win: "Ctrl-Alt-h", mac: "Command-Alt-h" },
                exec: function (editor) {
                    ace.config.loadModule("ace/ext/keybinding_menu", function (module) {
                        module.init(editor);
                        editor.showKeyboardShortcuts()
                    })
                }
            });

            editor.setValue(jsonVal, -1);
            editor.clearSelection();
            editor.resize(true);
            editor.focus();
            editor.getSession().getUndoManager().reset();

            editor.on("change", function (e) {
                jsonEditorChanged = true;
                xmlEditorChanged = false;
            });
        }

        document.getElementById("middleswitch").onclick = function () {

            let jsonVal = JSON.stringify(workflow, null, '\t');

            if (diag === true) {
                let wfIdStr = document.getElementById("wfid").value;
                if (isInt(wfIdStr)) {
                    let workflowId = parseInt(wfIdStr);

                    if (checkId === true) {
                        Common.get(uri + "/isWorkflowIdValid/" + workflowId,
                            function (res) {
                                if (res === true) {
                                    if (document.getElementById("wfname").value === "") {
                                        Common.toastInfo("Enter a name for this workflow.");
                                    } else {
                                        let lt = document.getElementById("wflaunchtype").value;
                                        if (lt === "") {
                                            Common.toastInfo("Select a launchType for this workflow.");
                                        } else {
                                            if (lt === "periodic" && document.getElementById("wfperiod").value === "") {
                                                Common.toastInfo("Enter a period for this workflow.");
                                            } else {
                                                if (lt === "cron" && document.getElementById("wfcronexp").value === "") {
                                                    Common.toastInfo("Enter a cron expression for this workflow.");
                                                } else {

                                                    // Period validation
                                                    if (lt === "periodic" && document.getElementById("wfperiod").value !== "") {
                                                        let period = document.getElementById("wfperiod").value;
                                                        Common.get(uri + "/isPeriodValid/" + period,
                                                            function (res) {
                                                                if (res === true) {
                                                                    openJsonView(jsonVal);
                                                                } else {
                                                                    Common.toastInfo("The period format is not valid. The valid format is: dd.hh:mm:ss");
                                                                }
                                                            },
                                                            function () { }, auth
                                                        );
                                                    } // Cron expression validation
                                                    else if (lt === "cron" && document.getElementById("wfcronexp").value !== "") {
                                                        let expression = document.getElementById("wfcronexp").value;
                                                        let expressionEncoded = encodeURIComponent(expression);

                                                        Common.get(uri + "/isCronExpressionValid?e=" + expressionEncoded,
                                                            function (res) {
                                                                if (res === true) {
                                                                    openJsonView(jsonVal);
                                                                } else {
                                                                    if (confirm("The cron expression format is not valid.\nRead the documentation?")) {
                                                                        openInNewTab("https://github.com/aelassas/Wexflow/wiki/Cron-scheduling");
                                                                    }
                                                                }
                                                            },
                                                            function () { }, auth
                                                        );
                                                    } else {
                                                        openJsonView(jsonVal);
                                                    }

                                                }
                                            }
                                        }
                                    }
                                } else {
                                    Common.toastInfo("The workflow id is already in use. Enter another one.");
                                }
                            },
                            function () { }, auth
                        );
                    } else {

                        if (document.getElementById("wfname").value === "") {
                            Common.toastInfo("Enter a name for this workflow.");
                        } else {
                            let lt = document.getElementById("wflaunchtype").value;
                            if (lt === "") {
                                Common.toastInfo("Select a launchType for this workflow.");
                            } else {
                                if (lt === "periodic" && document.getElementById("wfperiod").value === "") {
                                    Common.toastInfo("Enter a period for this workflow.");
                                } else {
                                    if (lt === "cron" && document.getElementById("wfcronexp").value === "") {
                                        Common.toastInfo("Enter a cron expression for this workflow.");
                                    } else {

                                        // Period validation
                                        if (lt === "periodic" && document.getElementById("wfperiod").value !== "") {
                                            let period = document.getElementById("wfperiod").value;
                                            Common.get(uri + "/isPeriodValid/" + period,
                                                function (res) {
                                                    if (res === true) {
                                                        openJsonView(jsonVal);
                                                    } else {
                                                        Common.toastInfo("The period format is not valid. The valid format is: dd.hh:mm:ss");
                                                    }
                                                },
                                                function () { }, auth
                                            );
                                        } // Cron expression validation
                                        else if (lt === "cron" && document.getElementById("wfcronexp").value !== "") {
                                            let expression = document.getElementById("wfcronexp").value;
                                            let expressionEncoded = encodeURIComponent(expression);

                                            Common.get(uri + "/isCronExpressionValid?e=" + expressionEncoded,
                                                function (res) {
                                                    if (res === true) {
                                                        openJsonView(jsonVal);
                                                    } else {
                                                        if (confirm("The cron expression format is not valid.\nRead the documentation?")) {
                                                            openInNewTab("https://github.com/aelassas/Wexflow/wiki/Cron-scheduling");
                                                        }
                                                    }
                                                },
                                                function () { }, auth
                                            );
                                        } else {
                                            openJsonView(jsonVal);
                                        }

                                    }
                                }
                            }
                        }

                    }

                } else {
                    Common.toastInfo("Enter a valid workflow id.");
                }
            }
            else {
                openJsonView(jsonVal);
            }
        };

        // xml click
        function openXmlView(xmlVal) {

            diag = false;
            json = false;
            graph = false;
            xml = true;

            xmlEditorChanged = false;

            leftcard.style.display = "none";
            propwrap.style.display = "none";
            wfclose.style.display = "none";
            wfpropwrap.style.display = "none";
            canvas.style.display = "none";
            document.getElementById("blocklyArea").style.display = "none";
            code.style.display = "block";

            document.getElementById("rightswitch").style.backgroundColor = "#F0F0F0";
            document.getElementById("graphswitch").style.backgroundColor = "transparent";
            document.getElementById("leftswitch").style.backgroundColor = "transparent";
            document.getElementById("middleswitch").style.backgroundColor = "transparent";

            editor = ace.edit("code");
            editor.setOptions({
                maxLines: Infinity,
                autoScrollEditorIntoView: true
            });

            editor.setReadOnly(false);
            editor.setFontSize("100%");
            editor.setPrintMarginColumn(false);
            editor.getSession().setMode("ace/mode/xml");
            editor.setTheme("ace/theme/github");


            editor.commands.addCommand({
                name: "showKeyboardShortcuts",
                bindKey: { win: "Ctrl-Alt-h", mac: "Command-Alt-h" },
                exec: function (editor) {
                    ace.config.loadModule("ace/ext/keybinding_menu", function (module) {
                        module.init(editor);
                        editor.showKeyboardShortcuts()
                    })
                }
            });

            editor.setValue(xmlVal, -1);
            editor.clearSelection();
            editor.resize(true);
            editor.focus();
            editor.getSession().getUndoManager().reset();

            editor.on("change", function (e) {
                xmlEditorChanged = true;
                jsonEditorChanged = false;
            });
        };

        document.getElementById("rightswitch").onclick = function () {
            Common.get(uri + "/graphXml/" + (workflow.WorkflowInfo.Id ? workflow.WorkflowInfo.Id : 0), function (val) {
                function getXml() {
                    let graph = val;

                    let xmlVal = '<Workflow xmlns="urn:wexflow-schema" id="' + workflow.WorkflowInfo.Id + '" name="' + workflow.WorkflowInfo.Name + '" description="' + workflow.WorkflowInfo.Description + '">\r\n';
                    xmlVal += '\t<Settings>\r\n\t\t<Setting name="launchType" value="' + launchType(workflow.WorkflowInfo.LaunchType) + '" />' + (workflow.WorkflowInfo.Period !== '' && workflow.WorkflowInfo.Period !== '00:00:00' ? ('\r\n\t\t<Setting name="period" value="' + workflow.WorkflowInfo.Period + '" />') : '') + (workflow.WorkflowInfo.CronExpression !== '' && workflow.WorkflowInfo.CronExpression !== null ? ('\r\n\t\t<Setting name="cronExpression" value="' + workflow.WorkflowInfo.CronExpression + '" />') : '') + '\r\n\t\t<Setting name="enabled" value="' + workflow.WorkflowInfo.IsEnabled + '" />\r\n\t\t<Setting name="approval" value="' + workflow.WorkflowInfo.IsApproval + '" />\r\n\t\t<Setting name="enableParallelJobs" value="' + workflow.WorkflowInfo.EnableParallelJobs + '" />\r\n\t</Settings>\r\n';
                    if (workflow.WorkflowInfo.LocalVariables.length > 0) {
                        xmlVal += '\t<LocalVariables>\r\n';
                        for (let i = 0; i < workflow.WorkflowInfo.LocalVariables.length; i++) {
                            if (workflow.WorkflowInfo.LocalVariables[i].Key !== "") {
                                xmlVal += '\t\t<Variable name="' + workflow.WorkflowInfo.LocalVariables[i].Key + '" value="' + workflow.WorkflowInfo.LocalVariables[i].Value + '" />\r\n'
                            }
                        }
                        xmlVal += '\t</LocalVariables>\r\n';
                    } else {
                        xmlVal += '\t<LocalVariables />\r\n';
                    }
                    if (workflow.Tasks.length > 0) {
                        xmlVal += '\t<Tasks>\r\n';
                        for (let i = 0; i < workflow.Tasks.length; i++) {
                            let task = workflow.Tasks[i];
                            xmlVal += '\t\t<Task id="' + task.Id + '" name="' + task.Name + '" description="' + task.Description + '" enabled="' + task.IsEnabled + '">\r\n';
                            for (let j = 0; j < task.Settings.length; j++) {
                                let setting = task.Settings[j];
                                //if (setting.Value !== "") {
                                xmlVal += '\t\t\t<Setting name="' + setting.Name + '" value="' + setting.Value + '" />\r\n';
                                //}
                            }
                            xmlVal += '\t\t</Task>\r\n';
                        }
                        xmlVal += '\t</Tasks>\r\n';
                    } else {
                        xmlVal += '\t<Tasks />\r\n';
                    }
                    if (graph !== "<ExecutionGraph />") {
                        xmlVal += graph + "\r\n";
                    }
                    xmlVal += '</Workflow>';

                    return xmlVal;
                }

                if (diag === true) {
                    let wfIdStr = document.getElementById("wfid").value;
                    if (isInt(wfIdStr)) {
                        let workflowId = parseInt(wfIdStr);
                        if (checkId === true) {
                            Common.get(uri + "/isWorkflowIdValid/" + workflowId,
                                function (res) {
                                    if (res === true) {
                                        if (document.getElementById("wfname").value === "") {
                                            Common.toastInfo("Enter a name for this workflow.");
                                        } else {
                                            let lt = document.getElementById("wflaunchtype").value;
                                            if (lt === "") {
                                                Common.toastInfo("Select a launchType for this workflow.");
                                            } else {
                                                if (lt === "periodic" && document.getElementById("wfperiod").value === "") {
                                                    Common.toastInfo("Enter a period for this workflow.");
                                                } else {
                                                    if (lt === "cron" && document.getElementById("wfcronexp").value === "") {
                                                        Common.toastInfo("Enter a cron expression for this workflow.");
                                                    } else {

                                                        // Period validation
                                                        if (lt === "periodic" && document.getElementById("wfperiod").value !== "") {
                                                            let period = document.getElementById("wfperiod").value;
                                                            Common.get(uri + "/isPeriodValid/" + period,
                                                                function (res) {
                                                                    if (res === true) {
                                                                        openXmlView(getXml());
                                                                    } else {
                                                                        Common.toastInfo("The period format is not valid. The valid format is: dd.hh:mm:ss");
                                                                    }
                                                                },
                                                                function () { }, auth
                                                            );
                                                        } // Cron expression validation
                                                        else if (lt === "cron" && document.getElementById("wfcronexp").value !== "") {
                                                            let expression = document.getElementById("wfcronexp").value;
                                                            let expressionEncoded = encodeURIComponent(expression);

                                                            Common.get(uri + "/isCronExpressionValid?e=" + expressionEncoded,
                                                                function (res) {
                                                                    if (res === true) {
                                                                        openXmlView(getXml());
                                                                    } else {
                                                                        if (confirm("The cron expression format is not valid.\nRead the documentation?")) {
                                                                            openInNewTab("https://github.com/aelassas/Wexflow/wiki/Cron-scheduling");
                                                                        }
                                                                    }
                                                                },
                                                                function () { }, auth
                                                            );
                                                        } else {
                                                            openXmlView(getXml());
                                                        }

                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        Common.toastInfo("The workflow id is already in use. Enter another one.");
                                    }
                                },
                                function () { }, auth
                            );
                        } else {

                            if (document.getElementById("wfname").value === "") {
                                Common.toastInfo("Enter a name for this workflow.");
                            } else {
                                let lt = document.getElementById("wflaunchtype").value;
                                if (lt === "") {
                                    Common.toastInfo("Select a launchType for this workflow.");
                                } else {
                                    if (lt === "periodic" && document.getElementById("wfperiod").value === "") {
                                        Common.toastInfo("Enter a period for this workflow.");
                                    } else {
                                        if (lt === "cron" && document.getElementById("wfcronexp").value === "") {
                                            Common.toastInfo("Enter a cron expression for this workflow.");
                                        } else {

                                            // Period validation
                                            if (lt === "periodic" && document.getElementById("wfperiod").value !== "") {
                                                let period = document.getElementById("wfperiod").value;
                                                Common.get(uri + "/isPeriodValid/" + period,
                                                    function (res) {
                                                        if (res === true) {
                                                            openXmlView(getXml());
                                                        } else {
                                                            Common.toastInfo("The period format is not valid. The valid format is: dd.hh:mm:ss");
                                                        }
                                                    },
                                                    function () { }, auth
                                                );
                                            } // Cron expression validation
                                            else if (lt === "cron" && document.getElementById("wfcronexp").value !== "") {
                                                let expression = document.getElementById("wfcronexp").value;
                                                let expressionEncoded = encodeURIComponent(expression);

                                                Common.get(uri + "/isCronExpressionValid?e=" + expressionEncoded,
                                                    function (res) {
                                                        if (res === true) {
                                                            openXmlView(getXml());
                                                        } else {
                                                            if (confirm("The cron expression format is not valid.\nRead the documentation?")) {
                                                                openInNewTab("https://github.com/aelassas/Wexflow/wiki/Cron-scheduling");
                                                            }
                                                        }
                                                    },
                                                    function () { }, auth
                                                );
                                            } else {
                                                openXmlView(getXml());
                                            }

                                        }
                                    }
                                }
                            }

                        }

                    } else {
                        Common.toastInfo("Enter a valid workflow id.");
                    }
                }
                else {
                    openXmlView(getXml());
                }
            }, function () {
            }, auth);
        };

        // Browse workflows
        let modal = null;
        let exportModal = null;

        function loadDiagram(workflowId) {
            Common.get(uri + "/json/" + workflowId,
                function (val) {
                    workflow = val;
                    initialWorkflow = JSON.parse(JSON.stringify(val));;

                    // fill workflow settings
                    document.getElementById("wfid").value = workflow.WorkflowInfo.Id;
                    document.getElementById("wfname").value = workflow.WorkflowInfo.Name;
                    document.getElementById("wfdesc").value = workflow.WorkflowInfo.Description;
                    document.getElementById("wflaunchtype").value = launchType(workflow.WorkflowInfo.LaunchType);
                    document.getElementById("wfperiod").value = workflow.WorkflowInfo.Period;
                    document.getElementById("wfcronexp").value = workflow.WorkflowInfo.CronExpression;
                    document.getElementById("wfenabled").checked = workflow.WorkflowInfo.IsEnabled;
                    document.getElementById("wfapproval").checked = workflow.WorkflowInfo.IsApproval;
                    document.getElementById("wfenablepj").checked = workflow.WorkflowInfo.EnableParallelJobs;

                    // Local variables
                    document.getElementsByClassName("wf-local-vars")[0].innerHTML = "";
                    if (workflow.WorkflowInfo.LocalVariables.length > 0) {
                        let varsHtml = "";
                        for (let i = 0; i < workflow.WorkflowInfo.LocalVariables.length; i++) {
                            let variable = workflow.WorkflowInfo.LocalVariables[i];
                            let varKey = variable.Key;
                            let varValue = variable.Value;
                            varsHtml += "<tr>";
                            varsHtml += "<td><input class='form-control wf-var-key' type='text' value='" + varKey + "'></td>";
                            varsHtml += "<td><button type='button' class='wf-remove-var btn btn-danger'>Delete</button></td>";
                            varsHtml += "</tr>";
                            varsHtml += "<tr>";
                            varsHtml += "<td class='wf-value' colspan='2'><input class='form-control wf-var-value' type='text' value='" + varValue + "'></td>";
                            varsHtml += "</tr>";
                        }
                        varsHtml += "</table>";
                        document.getElementsByClassName("wf-local-vars")[0].innerHTML = varsHtml;

                        // Bind keys modifications
                        let bindVarKey = function (index) {
                            let wfVarKey = document.getElementsByClassName("wf-var-key")[index];
                            wfVarKey.onkeyup = function () {
                                workflow.WorkflowInfo.LocalVariables[index].Key = wfVarKey.value;
                            };
                        };

                        let wfVarKeys = document.getElementsByClassName("wf-var-key");
                        for (let i = 0; i < wfVarKeys.length; i++) {
                            bindVarKey(i);
                        }

                        // Bind values modifications
                        let bindVarValue = function (index) {
                            let wfVarValue = document.getElementsByClassName("wf-var-value")[index];
                            wfVarValue.onkeyup = function () {
                                workflow.WorkflowInfo.LocalVariables[index].Value = wfVarValue.value;
                            };
                        };

                        let wfVarValues = document.getElementsByClassName("wf-var-value");
                        for (let i = 0; i < wfVarValues.length; i++) {
                            bindVarValue(i);
                        }

                        // Bind delete variables
                        let bindDeleteVar = function (index) {
                            let wfVarDelete = document.getElementsByClassName("wf-remove-var")[index];
                            wfVarDelete.onclick = function () {
                                let res = confirm("Are you sure you want to delete this variable?");
                                if (res === true) {
                                    index = parseInt(getElementIndex(wfVarDelete.parentElement.parentElement) / 2);
                                    workflow.WorkflowInfo.LocalVariables = deleteRow(workflow.WorkflowInfo.LocalVariables, index);
                                    wfVarDelete.parentNode.parentNode.nextSibling.remove();
                                    wfVarDelete.parentElement.parentElement.remove();
                                }
                                return false;
                            };
                        };

                        let wfVarDeleteBtns = document.getElementsByClassName("wf-remove-var");
                        for (let i = 0; i < wfVarDeleteBtns.length; i++) {
                            bindDeleteVar(i);
                        }
                    }

                    tasks = {};
                    for (let i = 0; i < workflow.Tasks.length; i++) {
                        let task = workflow.Tasks[i];
                        tasks[i] = task;
                    }

                    // load flowy
                    let flowyinput = {};
                    canvas.style.width = "100%";
                    canvas.style.left = "0";

                    document.getElementById("leftcard").style.left = -leftcardwidth + "px";
                    closecardimg.src = "assets/openleft.png";
                    leftcardHidden = true;

                    document.getElementById("wfpropwrap").style.right = -wfpropwidth + "px";
                    wfclose.style.right = "0";
                    wfpropHidden = true;
                    closewfcardimg.src = "assets/closeleft.png";

                    closeTaskSettings();

                    // build canvashtml
                    let canvashtml = "";
                    let blockspace = 180;
                    let arrowspace = 180;
                    for (let i = 0; i < workflow.Tasks.length; i++) {
                        let task = workflow.Tasks[i];
                        canvashtml += "<div class='blockelem noselect block' style='left: 500px; top: " + (25 + blockspace * i) + "px;'><input type='hidden' name='blockelemtype' class='blockelemtype' value='" + task.Name + "'><input type='hidden' name='blockelemdesc' class='blockelemdesc' value='" + task.Description + "'><input type='hidden' name='blockid' class='blockid' value='" + i + "'><div class='blockyleft'><img src='assets/actionorange.svg'><p class='blockyname'>" + task.Id + ". " + task.Name + "</p></div><div class='blockyright'><img class='removediagblock' src='assets/close.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>" + task.Description + "</div><div class='indicator invisible' style='left: 154px; top: 100px;'></div></div>";
                        if (i < workflow.Tasks.length - 1) {
                            //canvashtml += "<div class='arrowblock' style='left: 639px; top: " + (125 + arrowspace * i) + "px;'><input type='hidden' class='arrowid' value='" + (i + 1) + "'><svg preserveAspectRatio='none' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M20 0L20 40L20 40L20 80' stroke='#6CA5EC' stroke-width='2px'></path><path d='M15 75H25L20 80L15 75Z' fill='#6CA5EC'></path></svg></div>";
                            canvashtml += "<div class='arrowblock' style='left: 639px; top: " + (125 + arrowspace * i) + "px;'><input type='hidden' class='arrowid' value='" + (i + 1) + "'><svg preserveAspectRatio='none' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M20 0L20 40L20 40L20 80' stroke='#6CA5EC' stroke-width='2px'></path></svg></div>";
                        }
                    }

                    // build blockarr
                    let blockarr = [];
                    for (let i = 0; i < workflow.Tasks.length; i++) {
                        blockarr.push(
                            {
                                "parent": i - 1,
                                "childwidth": (i < workflow.Tasks.length - 1 ? 318 : 0),
                                "id": i,
                                "x": 644,
                                "y": 190 + blockspace * i,
                                "width": 318,
                                "height": 100
                            });
                    }

                    flowyinput = {
                        "html": canvashtml,
                        "blockarr": blockarr
                    };

                    flowy.import(flowyinput);

                    // disable checkId
                    checkId = false;

                    // show delete button
                    removeworkflow.style.display = "block";

                    // close jBox
                    if (modal) {
                        modal.close();
                        modal.destroy();
                    }


                },
                function () { }, auth);
        }

        function browse() {
            if (browserOpen === false) {
                document.getElementById("overlay").style.display = "block";
                Common.get(uri + "/search?s=",
                    function (data) {

                        data.sort(compareById);

                        let workflowsToTable = function (wfs) {
                            workflows = {};
                            let items = [];
                            for (let i = 0; i < wfs.length; i++) {
                                let val = wfs[i];
                                workflows[val.Id] = val;
                                items.push("<tr>" +
                                    "<td><input class='wf-delete' type='checkbox'></td>" +
                                    "<td class='wf-id' title='" + val.Id + "'>" + val.Id + "</td>" +
                                    "<td class='wf-n' title='" + val.Name + "'>" + val.Name + "</td>" +
                                    "<td class='wf-d' title='" + val.Description + "'>" + val.Description + "</td>" +
                                    "</tr>");

                            }

                            let table = "<table class='wf-workflows-table table'>" +
                                "<thead class='thead-dark'>" +
                                "<tr>" +
                                "<th><input id='wf-delete-all' type='checkbox'></th>" +
                                "<th class='wf-id'>Id</th>" +
                                "<th class='wf-n'>Name</th>" +
                                "<th class='wf-d'>Description</th>" +
                                "</tr>" +
                                "</thead>" +
                                "<tbody>" +
                                items.join("") +
                                "</tbody>" +
                                "</table>";

                            return table;
                        };
                        let browserHeader = '<div id="searchworkflows"><img src="assets/search.svg"><input id="searchworkflowsinput" type="text" placeholder="Search workflows"></div><small style="float: right;">Ctrl+O to open this window.</small>';
                        let browserHtml = workflowsToTable(data);

                        let browserFooter = '<div id="openworkflow">Open</div><div id="deleteworkflows">Delete</div>';

                        if (exportModal) {
                            exportModal.destroy();
                        }

                        if (modal) {
                            modal.destroy();
                        }

                        modal = new jBox('Modal', {
                            width: 800,
                            height: 420,
                            title: browserHeader,
                            content: browserHtml,
                            footer: browserFooter,
                            overlay: true,
                            isolateScroll: false,
                            delayOpen: 0,
                            onOpen: function () {
                                document.getElementById("overlay").style.display = "none";
                                browserOpen = true;
                            },
                            onClose: function () {
                                browserOpen = false;
                            }
                        });
                        modal.open();

                        let searchworkflows = document.getElementById("searchworkflowsinput");
                        searchworkflows.focus();
                        searchworkflows.select();
                        searchworkflows.onkeyup = function (event) {
                            event.preventDefault();
                            if (event.keyCode === 13) { // Enter
                                let jbox = document.getElementsByClassName("jBox-content")[0];

                                Common.get(uri + "/search?s=" + searchworkflows.value,
                                    function (wfs) {
                                        wfs.sort(compareById);

                                        jbox.innerHTML = workflowsToTable(wfs);

                                        // selection changed event
                                        let workflowsTable = jbox.childNodes[0];
                                        let rows = (workflowsTable.getElementsByTagName("tbody")[0]).getElementsByTagName("tr");
                                        for (let i = 0; i < rows.length; i++) {
                                            let row = rows[i];

                                            row.onclick = function () {
                                                let selected = document.getElementsByClassName("selected");
                                                if (selected.length > 0) {
                                                    selected[0].className = selected[0].className.replace("selected", "");
                                                }
                                                row.className += "selected";
                                            };

                                            let deleteWorkflowCheckBox = row.getElementsByClassName("wf-delete")[0];
                                            deleteWorkflowCheckBox.onchange = function () {
                                                let currentRow = this.parentElement.parentElement;
                                                let workflowId = parseInt(currentRow.getElementsByClassName("wf-id")[0].innerHTML);
                                                let dbId = workflows[workflowId].DbId;
                                                if (this.checked === true) {
                                                    workflowsToDelete.push(dbId);
                                                } else {
                                                    let dbIdIndex = workflowsToDelete.indexOf(dbId);
                                                    if (dbIdIndex > -1) {
                                                        workflowsToDelete.splice(dbIdIndex, 1);
                                                    }
                                                }
                                            };
                                        }

                                        // on workflows table dbl click
                                        document.getElementsByClassName("jBox-content")[0].childNodes[0].ondblclick = function () {
                                            if (this.querySelectorAll(".selected").length > 0) {
                                                openWorkflow();
                                            }
                                        };

                                        let checkBoxDeleteAll = workflowsTable.querySelector("#wf-delete-all");
                                        checkBoxDeleteAll.onclick = function () {
                                            for (let i = 0; i < rows.length; i++) {
                                                let row = rows[i];
                                                let workflowId = parseInt(row.getElementsByClassName("wf-id")[0].innerHTML);
                                                let dbId = workflows[workflowId].DbId;
                                                let deleteWorkflowCheckBox = row.getElementsByClassName("wf-delete")[0];
                                                if (deleteWorkflowCheckBox.checked === false) {
                                                    deleteWorkflowCheckBox.checked = true;
                                                    workflowsToDelete.push(dbId);
                                                } else {
                                                    deleteWorkflowCheckBox.checked = false;
                                                    let dbIdIndex = workflowsToDelete.indexOf(dbId);
                                                    if (dbIdIndex > -1) {
                                                        workflowsToDelete.splice(dbIdIndex, 1);
                                                    }
                                                }
                                            }
                                        };

                                    }, function () {
                                        Common.toastError("An error occured while retrieving workflows. Check that wexflow server is running correctly.");
                                    }, auth);
                            }
                        };

                        let workflowsTable = document.getElementsByClassName("jBox-content")[0].childNodes[0];

                        let rows = workflowsTable.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
                        if (rows.length > 0) {
                            let hrow = workflowsTable.getElementsByTagName("thead")[0].getElementsByTagName("tr")[0];
                            hrow.querySelector(".wf-id").style.width = rows[0].querySelector(".wf-id").offsetWidth + "px";
                            hrow.querySelector(".wf-n").style.width = rows[0].querySelector(".wf-n").offsetWidth + "px";
                            hrow.querySelector(".wf-d").style.width = rows[0].querySelector(".wf-d").offsetWidth + "px";
                        }

                        let descriptions = workflowsTable.querySelectorAll(".wf-d");
                        for (let i = 0; i < descriptions.length; i++) {
                            descriptions[i].style.width = workflowsTable.offsetWidth - 215 + "px";
                        }

                        // selection changed event
                        for (let i = 0; i < rows.length; i++) {
                            let row = rows[i];

                            row.onclick = function () {
                                let selected = document.getElementsByClassName("selected");
                                if (selected.length > 0) {
                                    selected[0].className = selected[0].className.replace("selected", "");
                                }
                                row.className += "selected";
                            };

                            let deleteWorkflowCheckBox = row.getElementsByClassName("wf-delete")[0];
                            deleteWorkflowCheckBox.onchange = function () {
                                let currentRow = this.parentElement.parentElement;
                                let workflowId = parseInt(currentRow.getElementsByClassName("wf-id")[0].innerHTML);
                                let dbId = workflows[workflowId].DbId;
                                if (this.checked === true) {
                                    workflowsToDelete.push(dbId);
                                } else {
                                    let dbIdIndex = workflowsToDelete.indexOf(dbId);
                                    if (dbIdIndex > -1) {
                                        workflowsToDelete.splice(dbIdIndex, 1);
                                    }
                                }
                            };
                        }

                        // wf-delete-all select
                        let checkBoxDeleteAll = workflowsTable.querySelector("#wf-delete-all");
                        checkBoxDeleteAll.onclick = function () {
                            for (let i = 0; i < rows.length; i++) {
                                let row = rows[i];
                                let workflowId = parseInt(row.getElementsByClassName("wf-id")[0].innerHTML);
                                let dbId = workflows[workflowId].DbId;
                                let deleteWorkflowCheckBox = row.getElementsByClassName("wf-delete")[0];
                                if (deleteWorkflowCheckBox.checked === false) {
                                    deleteWorkflowCheckBox.checked = true;
                                    workflowsToDelete.push(dbId);
                                } else {
                                    deleteWorkflowCheckBox.checked = false;
                                    let dbIdIndex = workflowsToDelete.indexOf(dbId);
                                    if (dbIdIndex > -1) {
                                        workflowsToDelete.splice(dbIdIndex, 1);
                                    }
                                }
                            }
                        };

                        // open click
                        document.getElementById("openworkflow").onclick = function () {
                            openWorkflow();
                        };

                        // delete click
                        document.getElementById("deleteworkflows").onclick = function () {
                            if (workflowsToDelete.length > 0) {
                                let confirmRes = confirm("Are you sure you want to delete selected workflows?");
                                if (confirmRes === true) {
                                    Common.post(uri + "/deleteWorkflows", function (res) {
                                        if (res === true) {
                                            Common.toastSuccess("Workflows deleted with success.");
                                            if (isNaN(parseInt(workflow.WorkflowInfo.Id)) === false && workflows[workflow.WorkflowInfo.Id] && workflowsToDelete.includes(workflows[workflow.WorkflowInfo.Id].DbId)) {
                                                checkId = true;
                                                openSavePopup = false;
                                                workflowDeleted = true;
                                                flowy.deleteBlocks();
                                                removeworkflow.style.display = "none";

                                                document.getElementById("leftcard").style.left = -leftcardwidth + "px";
                                                closecardimg.src = "assets/openleft.png";
                                                leftcardHidden = true;

                                                document.getElementById("wfpropwrap").style.right = -wfpropwidth + "px";
                                                wfpropHidden = true;
                                                closewfcardimg.src = "assets/closeleft.png";
                                                wfclose.style.right = "0";

                                                if (rightcard === true) {
                                                    rightcard = false;
                                                    document.getElementById("properties").classList.remove("expanded");
                                                    setTimeout(function () {
                                                        document.getElementById("propwrap").classList.remove("itson");
                                                    }, 300);
                                                    if (tempblock) {
                                                        tempblock.classList.remove("selectedblock");
                                                    }
                                                }

                                                document.getElementById("wfid").value = "";

                                                document.getElementById("wfname").value = "";
                                                document.getElementById("wfdesc").value = "";
                                                document.getElementById("wflaunchtype").value = "";
                                                document.getElementById("wfperiod").value = "";
                                                document.getElementById("wfcronexp").value = "";
                                                document.getElementById("wfenabled").checked = true;
                                                document.getElementById("wfapproval").checked = false;
                                                document.getElementById("wfenablepj").checked = true;

                                                document.getElementsByClassName("wf-local-vars")[0].innerHTML = "";

                                                workflow = {
                                                    "WorkflowInfo": {
                                                        "Id": document.getElementById("wfid").value,
                                                        "Name": document.getElementById("wfname").value,
                                                        "Description": document.getElementById("wfdesc").value,
                                                        "LaunchType": launchTypeReverse(document.getElementById("wflaunchtype").value),
                                                        "Period": document.getElementById("wfperiod").value,
                                                        "CronExpression": document.getElementById("wfcronexp").value,
                                                        "IsEnabled": document.getElementById("wfenabled").checked,
                                                        "IsApproval": document.getElementById("wfapproval").checked,
                                                        "EnableParallelJobs": document.getElementById("wfenablepj").checked,
                                                        "LocalVariables": []
                                                    },
                                                    "Tasks": []
                                                }
                                                tasks = {};

                                                if (json || xml || graph) {
                                                    document.getElementById("code-container").style.display = "none";
                                                    document.getElementById("blocklyArea").style.display = "none";
                                                    json = false;
                                                    xml = false;
                                                    graph = false;
                                                }

                                                leftcard.style.display = "block";
                                                propwrap.style.display = "block";
                                                wfclose.style.display = "block";
                                                wfpropwrap.style.display = "block";
                                                canvas.style.display = "block";
                                                code.style.display = "none";

                                                document.getElementById("leftswitch").style.backgroundColor = "#F0F0F0";
                                                document.getElementById("graphswitch").style.backgroundColor = "transparent";
                                                document.getElementById("middleswitch").style.backgroundColor = "transparent";
                                                document.getElementById("rightswitch").style.backgroundColor = "transparent";
                                                diag = true;
                                            }

                                            workflowsToDelete = [];

                                            // Reload workfows
                                            let jbox = document.getElementsByClassName("jBox-content")[0];

                                            Common.get(uri + "/search?s=" + searchworkflows.value,
                                                function (wfs) {
                                                    wfs.sort(compareById);

                                                    jbox.innerHTML = workflowsToTable(wfs);

                                                    // selection changed event
                                                    let workflowsTable = jbox.childNodes[0];
                                                    let rows = (workflowsTable.getElementsByTagName("tbody")[0]).getElementsByTagName("tr");
                                                    for (let i = 0; i < rows.length; i++) {
                                                        let row = rows[i];

                                                        row.onclick = function () {
                                                            let selected = document.getElementsByClassName("selected");
                                                            if (selected.length > 0) {
                                                                selected[0].className = selected[0].className.replace("selected", "");
                                                            }
                                                            row.className += "selected";
                                                        };

                                                        let deleteWorkflowCheckBox = row.getElementsByClassName("wf-delete")[0];
                                                        deleteWorkflowCheckBox.onchange = function () {
                                                            let currentRow = this.parentElement.parentElement;
                                                            let workflowId = parseInt(currentRow.getElementsByClassName("wf-id")[0].innerHTML);
                                                            let dbId = workflows[workflowId].DbId;
                                                            if (this.checked === true) {
                                                                workflowsToDelete.push(dbId);
                                                            } else {
                                                                let dbIdIndex = workflowsToDelete.indexOf(dbId);
                                                                if (dbIdIndex > -1) {
                                                                    workflowsToDelete.splice(dbIdIndex, 1);
                                                                }
                                                            }
                                                        };
                                                    }

                                                    // on workflows table dbl click
                                                    document.getElementsByClassName("jBox-content")[0].childNodes[0].ondblclick = function () {
                                                        if (this.querySelectorAll(".selected").length > 0) {
                                                            openWorkflow();
                                                        }
                                                    };

                                                    let checkBoxDeleteAll = workflowsTable.querySelector("#wf-delete-all");
                                                    checkBoxDeleteAll.onclick = function () {
                                                        for (let i = 0; i < rows.length; i++) {
                                                            let row = rows[i];
                                                            let workflowId = parseInt(row.getElementsByClassName("wf-id")[0].innerHTML);
                                                            let dbId = workflows[workflowId].DbId;
                                                            let deleteWorkflowCheckBox = row.getElementsByClassName("wf-delete")[0];
                                                            if (deleteWorkflowCheckBox.checked === false) {
                                                                deleteWorkflowCheckBox.checked = true;
                                                                workflowsToDelete.push(dbId);
                                                            } else {
                                                                deleteWorkflowCheckBox.checked = false;
                                                                let dbIdIndex = workflowsToDelete.indexOf(dbId);
                                                                if (dbIdIndex > -1) {
                                                                    workflowsToDelete.splice(dbIdIndex, 1);
                                                                }
                                                            }
                                                        }
                                                    };

                                                }, function () {
                                                    Common.toastError("An error occured while retrieving workflows. Check that wexflow server is running correctly.");
                                                }, auth);

                                        } else {
                                            Common.toastError("An error occured while deleting workflows.");
                                        }
                                    }, function () {
                                        Common.toastError("An error occured while deleting workflows.");
                                    }, {
                                        "WorkflowsToDelete": workflowsToDelete
                                    }, auth);
                                }
                            } else {
                                Common.toastInfo("Select workflows to delete");
                            }
                        };

                        // on workflows table dbl click
                        document.getElementsByClassName("jBox-content")[0].childNodes[0].ondblclick = function () {
                            if (this.querySelectorAll(".selected").length > 0) {
                                openWorkflow();
                            }
                        };
                    },
                    function () {
                        document.getElementById("overlay").style.display = "none";
                        Common.toastError("An error occured while retrieving workflows. Check that wexflow server is running correctly.");
                    }, auth);
            }
        }

        document.getElementById("browse").onclick = function () {
            browse();
        };

        function openWorkflow() {
            if (document.getElementsByClassName("selected").length === 0) {
                Common.toastInfo("Choose a workflow to open.");
            } else {
                saveChanges(function () {
                    workflowDeleted = false;
                    openSavePopup = false;
                }, function () {
                    workflowDeleted = false;
                    openSavePopup = false;
                });
            }
        }

        function saveChanges(onSave, onCancel) {
            let selected = document.getElementsByClassName("selected");

            let id = (selected.length > 0 ? parseInt(selected[0].getElementsByClassName("wf-id")[0].innerHTML) : -1);
            let workflowChanged = _.isEqual(initialWorkflow, workflow) === false && initialWorkflow !== null;

            if (openSavePopup === true || (workflowDeleted === false && workflowChanged === true) || (json === true && jsonEditorChanged === true) || (xml === true && xmlEditorChanged === true)) {
                let res = confirm("Save changes?");
                if (res === true) {
                    let wfid = document.getElementById("wfid").value;

                    if (diag === true || graph === true) {
                        updateTasks();

                        let saveFunc = function () {
                            Common.post(uri + "/save", function (res) {
                                if (res === true) {
                                    checkId = false;
                                    removeworkflow.style.display = "block";
                                    // load diagram
                                    if (id > -1) {
                                        loadDiagram(id);
                                        if (graph === true) {
                                            openGraph(id);
                                        }
                                    }
                                    Common.toastSuccess("workflow " + wfid + " saved and loaded with success from diagram view.");

                                    if (onSave) {
                                        onSave();
                                    }
                                } else {
                                    Common.toastError("An error occured while saving the workflow " + wfid + " from diagram view.");
                                }
                            }, function () {
                                Common.toastError("An error occured while saving the workflow " + wfid + " from diagram view.");
                            }, workflow, auth);
                        };

                        let wfIdStr = document.getElementById("wfid").value;
                        if (isInt(wfIdStr)) {
                            let workflowId = parseInt(wfIdStr);

                            if (checkId === true) {
                                Common.get(uri + "/isWorkflowIdValid/" + workflowId,
                                    function (res) {
                                        if (res === true) {
                                            if (document.getElementById("wfname").value === "") {
                                                Common.toastInfo("Enter a name for this workflow.");
                                            } else {
                                                let lt = document.getElementById("wflaunchtype").value;
                                                if (lt === "") {
                                                    Common.toastInfo("Select a launchType for this workflow.");
                                                } else {
                                                    if (lt === "periodic" && document.getElementById("wfperiod").value === "") {
                                                        Common.toastInfo("Enter a period for this workflow.");
                                                    } else {
                                                        if (lt === "cron" && document.getElementById("wfcronexp").value === "") {
                                                            Common.toastInfo("Enter a cron expression for this workflow.");
                                                        } else {

                                                            // Period validation
                                                            if (lt === "periodic" && document.getElementById("wfperiod").value !== "") {
                                                                let period = document.getElementById("wfperiod").value;
                                                                Common.get(uri + "/isPeriodValid/" + period,
                                                                    function (res) {
                                                                        if (res === true) {
                                                                            saveFunc();
                                                                        } else {
                                                                            Common.toastInfo("The period format is not valid. The valid format is: dd.hh:mm:ss");
                                                                        }
                                                                    },
                                                                    function () { }, auth
                                                                );
                                                            } // Cron expression validation
                                                            else if (lt === "cron" && document.getElementById("wfcronexp").value !== "") {
                                                                let expression = document.getElementById("wfcronexp").value;
                                                                let expressionEncoded = encodeURIComponent(expression);

                                                                Common.get(uri + "/isCronExpressionValid?e=" + expressionEncoded,
                                                                    function (res) {
                                                                        if (res === true) {
                                                                            saveFunc();
                                                                        } else {
                                                                            if (confirm("The cron expression format is not valid.\nRead the documentation?")) {
                                                                                openInNewTab("https://github.com/aelassas/Wexflow/wiki/Cron-scheduling");
                                                                            }
                                                                        }
                                                                    },
                                                                    function () { }, auth
                                                                );
                                                            } else {
                                                                saveFunc();
                                                            }

                                                        }
                                                    }
                                                }
                                            }
                                        } else {
                                            Common.toastInfo("The workflow id is already in use. Enter another one.");
                                        }
                                    },
                                    function () { }, auth
                                );
                            } else {

                                if (document.getElementById("wfname").value === "") {
                                    Common.toastInfo("Enter a name for this workflow.");
                                } else {
                                    let lt = document.getElementById("wflaunchtype").value;
                                    if (lt === "") {
                                        Common.toastInfo("Select a launchType for this workflow.");
                                    } else {
                                        if (lt === "periodic" && document.getElementById("wfperiod").value === "") {
                                            Common.toastInfo("Enter a period for this workflow.");
                                        } else {
                                            if (lt === "cron" && document.getElementById("wfcronexp").value === "") {
                                                Common.toastInfo("Enter a cron expression for this workflow.");
                                            } else {

                                                // Period validation
                                                if (lt === "periodic" && document.getElementById("wfperiod").value !== "") {
                                                    let period = document.getElementById("wfperiod").value;
                                                    Common.get(uri + "/isPeriodValid/" + period,
                                                        function (res) {
                                                            if (res === true) {
                                                                saveFunc();
                                                            } else {
                                                                Common.toastInfo("The period format is not valid. The valid format is: dd.hh:mm:ss");
                                                            }
                                                        },
                                                        function () { }, auth
                                                    );
                                                } // Cron expression validation
                                                else if (lt === "cron" && document.getElementById("wfcronexp").value !== "") {
                                                    let expression = document.getElementById("wfcronexp").value;
                                                    let expressionEncoded = encodeURIComponent(expression);

                                                    Common.get(uri + "/isCronExpressionValid?e=" + expressionEncoded,
                                                        function (res) {
                                                            if (res === true) {
                                                                saveFunc();
                                                            } else {
                                                                if (confirm("The cron expression format is not valid.\nRead the documentation?")) {
                                                                    openInNewTab("https://github.com/aelassas/Wexflow/wiki/Cron-scheduling");
                                                                }
                                                            }
                                                        },
                                                        function () { }, auth
                                                    );
                                                } else {
                                                    saveFunc();
                                                }

                                            }
                                        }
                                    }
                                }

                            }

                        } else {
                            Common.toastInfo("Enter a valid workflow id.");
                        }

                    } else if (json === true) {
                        let json = JSON.parse(editor.getValue());
                        Common.post(uri + "/save", function (res) {
                            if (res === true) {
                                if (id > -1) {
                                    Common.get(uri + "/json/" + id,
                                        function (val) {
                                            openJsonView(JSON.stringify(val, null, '\t'));
                                            jsonEditorChanged = false;
                                            loadDiagram(id);
                                            removeworkflow.style.display = "block";
                                            Common.toastSuccess("workflow " + wfid + " saved and loaded with success from JSON view.");
                                        }, function () { }, auth);
                                }
                                if (onSave) {
                                    onSave();
                                }
                            } else {
                                Common.toastError("An error occured while saving the workflow " + wfid + " from JSON view.");
                            }
                        }, function () {
                            Common.toastError("An error occured while saving the workflow " + wfid + " from JSON view.");
                        }, json, auth);
                    } else if (xml === true) {
                        let json = {
                            workflowId: workflow.WorkflowInfo.Id,
                            xml: editor.getValue()
                        };
                        Common.post(uri + "/saveXml", function (res) {
                            if (res === true) {
                                if (id > -1) {
                                    Common.get(uri + "/xml/" + id,
                                        function (val) {
                                            openXmlView(val);
                                            xmlEditorChanged = false;
                                            loadDiagram(id);
                                            removeworkflow.style.display = "block";
                                            Common.toastSuccess("workflow " + wfid + " saved and loaded with success from XML view.");
                                        }, function () { }, auth);
                                }

                                if (onSave) {
                                    onSave();
                                }
                            } else {
                                Common.toastError("An error occured while saving the workflow " + wfid + " from XML view.");
                            }
                        }, function () {
                            Common.toastError("An error occured while saving the workflow " + wfid + " from XML view.");
                        }, json, auth);
                    }
                } else {
                    // load view
                    if (id > -1) {
                        if (json === true) {
                            Common.get(uri + "/json/" + id,
                                function (val) {
                                    openJsonView(JSON.stringify(val, null, '\t'));
                                    jsonEditorChanged = false;
                                }, function () { }, auth);
                        } else if (xml === true) {
                            Common.get(uri + "/xml/" + id,
                                function (val) {
                                    openXmlView(val);
                                    xmlEditorChanged = false;
                                }, function () { }, auth);
                        } else if (graph === true) {
                            openGraph(id);
                        }

                        // load diagram
                        loadDiagram(id);
                    }

                    if (onCancel) {
                        onCancel();
                    }
                }
            } else {
                // load view
                if (id > -1) {
                    if (json === true) {
                        Common.get(uri + "/json/" + id,
                            function (val) {
                                openJsonView(JSON.stringify(val, null, '\t'));
                                jsonEditorChanged = false;
                            }, function () { }, auth);
                    } else if (xml === true) {
                        Common.get(uri + "/xml/" + id,
                            function (val) {
                                openXmlView(val);
                                xmlEditorChanged = false;
                            }, function () { }, auth);
                    } else if (graph === true) {
                        openGraph(id);
                    }

                    // load diagram
                    loadDiagram(id);
                }

                if (onCancel) {
                    onCancel();
                }
            }

        }

        function compareById(wf1, wf2) {
            if (wf1.Id < wf2.Id) {
                return -1;
            } else if (wf1.Id > wf2.Id) {
                return 1;
            }
            return 0;
        }

        document.getElementById("export").onclick = function () {

            if (exportModal) {
                exportModal.destroy();
            }

            if (modal) {
                modal.destroy();
            }

            let footer = '<div id="exportworkflow">Export</div>';

            exportModal = new jBox('Modal', {
                width: 800,
                height: 120,
                title: "Export",
                overlay: true,
                isolateScroll: false,
                content: document.getElementById("exportmodal").innerHTML,
                footer: footer,
                delayOpen: 0
            });

            exportModal.open();

            document.getElementById("exportworkflow").onclick = function () {
                let exportType = document.getElementsByClassName("jBox-content")[0].childNodes[3].value;

                // export whith validation
                if (exportType === "json") {
                    let downloadJson = function () {
                        download(JSON.stringify(workflow, null, '\t'), 'workflow-' + document.getElementById("wfid").value + '.json', 'application/json');
                        exportModal.close();
                    };

                    let wfIdStr = document.getElementById("wfid").value;
                    if (isInt(wfIdStr)) {
                        let workflowId = parseInt(wfIdStr);

                        if (checkId === true) {
                            Common.get(uri + "/isWorkflowIdValid/" + workflowId,
                                function (res) {
                                    if (res === true) {
                                        if (document.getElementById("wfname").value === "") {
                                            Common.toastInfo("Enter a name for this workflow.");
                                            exportModal.close();
                                        } else {
                                            let lt = document.getElementById("wflaunchtype").value;
                                            if (lt === "") {
                                                Common.toastInfo("Select a launchType for this workflow.");
                                                exportModal.close();
                                            } else {
                                                if (lt === "periodic" && document.getElementById("wfperiod").value === "") {
                                                    Common.toastInfo("Enter a period for this workflow.");
                                                    exportModal.close();
                                                } else {
                                                    if (lt === "cron" && document.getElementById("wfcronexp").value === "") {
                                                        Common.toastInfo("Enter a cron expression for this workflow.");
                                                        exportModal.close();
                                                    } else {

                                                        // Period validation
                                                        if (lt === "periodic" && document.getElementById("wfperiod").value !== "") {
                                                            let period = document.getElementById("wfperiod").value;
                                                            Common.get(uri + "/isPeriodValid/" + period,
                                                                function (res) {
                                                                    if (res === true) {
                                                                        downloadJson();
                                                                    } else {
                                                                        Common.toastInfo("The period format is not valid. The valid format is: dd.hh:mm:ss");
                                                                        exportModal.close();
                                                                    }
                                                                },
                                                                function () { }, auth
                                                            );
                                                        } // Cron expression validation
                                                        else if (lt === "cron" && document.getElementById("wfcronexp").value !== "") {
                                                            let expression = document.getElementById("wfcronexp").value;
                                                            let expressionEncoded = encodeURIComponent(expression);

                                                            Common.get(uri + "/isCronExpressionValid?e=" + expressionEncoded,
                                                                function (res) {
                                                                    if (res === true) {
                                                                        downloadJson();
                                                                    } else {
                                                                        exportModal.close();
                                                                        if (confirm("The cron expression format is not valid.\nRead the documentation?")) {
                                                                            openInNewTab("https://github.com/aelassas/Wexflow/wiki/Cron-scheduling");
                                                                        }
                                                                    }
                                                                },
                                                                function () { }, auth
                                                            );
                                                        } else {
                                                            downloadJson();
                                                        }

                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        Common.toastInfo("The workflow id is already in use. Enter another one.");
                                    }
                                },
                                function () { }, auth);
                        } else {

                            if (document.getElementById("wfname").value === "") {
                                Common.toastInfo("Enter a name for this workflow.");
                            } else {
                                let lt = document.getElementById("wflaunchtype").value;
                                if (lt === "") {
                                    Common.toastInfo("Select a launchType for this workflow.");
                                    exportModal.close();
                                } else {
                                    if (lt === "periodic" && document.getElementById("wfperiod").value === "") {
                                        Common.toastInfo("Enter a period for this workflow.");
                                        exportModal.close();
                                    } else {
                                        if (lt === "cron" && document.getElementById("wfcronexp").value === "") {
                                            Common.toastInfo("Enter a cron expression for this workflow.");
                                            exportModal.close();
                                        } else {

                                            // Period validation
                                            if (lt === "periodic" && document.getElementById("wfperiod").value !== "") {
                                                let period = document.getElementById("wfperiod").value;
                                                Common.get(uri + "/isPeriodValid/" + period,
                                                    function (res) {
                                                        if (res === true) {
                                                            downloadJson();
                                                        } else {
                                                            Common.toastInfo("The period format is not valid. The valid format is: dd.hh:mm:ss");
                                                            exportModal.close();
                                                        }
                                                    },
                                                    function () { }, auth
                                                );
                                            } // Cron expression validation
                                            else if (lt === "cron" && document.getElementById("wfcronexp").value !== "") {
                                                let expression = document.getElementById("wfcronexp").value;
                                                let expressionEncoded = encodeURIComponent(expression);

                                                Common.get(uri + "/isCronExpressionValid?e=" + expressionEncoded,
                                                    function (res) {
                                                        if (res === true) {
                                                            downloadJson();
                                                        } else {
                                                            exportModal.close();
                                                            if (confirm("The cron expression format is not valid.\nRead the documentation?")) {
                                                                openInNewTab("https://github.com/aelassas/Wexflow/wiki/Cron-scheduling");
                                                            }
                                                        }
                                                    },
                                                    function () { }, auth
                                                );
                                            } else {
                                                downloadJson();
                                            }

                                        }
                                    }
                                }
                            }

                        }

                    } else {
                        Common.toastInfo("Enter a valid workflow id.");
                        exportModal.close();
                    }

                } else if (exportType === "xml") {
                    let downloadXml = function () {
                        if (xml === true) {
                            download(editor.getValue(), 'workflow-' + document.getElementById("wfid").value + '.xml', 'text/xml')
                            exportModal.close();
                        } else {
                            Common.get(uri + "/graphXml/" + workflow.WorkflowInfo.Id, function (val) {
                                let graph = val;

                                let xmlVal = '<Workflow xmlns="urn:wexflow-schema" id="' + workflow.WorkflowInfo.Id + '" name="' + workflow.WorkflowInfo.Name + '" description="' + workflow.WorkflowInfo.Description + '">\r\n';
                                xmlVal += '\t<Settings>\r\n\t\t<Setting name="launchType" value="' + launchType(workflow.WorkflowInfo.LaunchType) + '" />' + (workflow.WorkflowInfo.Period !== '' && workflow.WorkflowInfo.Period !== '00:00:00' ? ('\r\n\t\t<Setting name="period" value="' + workflow.WorkflowInfo.Period + '" />') : '') + (workflow.WorkflowInfo.CronExpression !== '' && workflow.WorkflowInfo.CronExpression !== null ? ('\r\n\t\t<Setting name="cronExpression" value="' + workflow.WorkflowInfo.CronExpression + '" />') : '') + '\r\n\t\t<Setting name="enabled" value="' + workflow.WorkflowInfo.IsEnabled + '" />\r\n\t\t<Setting name="approval" value="' + workflow.WorkflowInfo.IsApproval + '" />\r\n\t\t<Setting name="enableParallelJobs" value="' + workflow.WorkflowInfo.EnableParallelJobs + '" />\r\n\t</Settings>\r\n';
                                if (workflow.WorkflowInfo.LocalVariables.length > 0) {
                                    xmlVal += '\t<LocalVariables>\r\n';
                                    for (let i = 0; i < workflow.WorkflowInfo.LocalVariables.length; i++) {
                                        xmlVal += '\t\t<Variable name="' + workflow.WorkflowInfo.LocalVariables[i].Key + '" value="' + workflow.WorkflowInfo.LocalVariables[i].Value + '" />\r\n'
                                    }
                                    xmlVal += '\t</LocalVariables>\r\n';
                                } else {
                                    xmlVal += '\t<LocalVariables />\r\n';
                                }
                                if (workflow.Tasks.length > 0) {
                                    xmlVal += '\t<Tasks>\r\n';
                                    for (let i = 0; i < workflow.Tasks.length; i++) {
                                        let task = workflow.Tasks[i];
                                        xmlVal += '\t\t<Task id="' + task.Id + '" name="' + task.Name + '" description="' + task.Description + '" enabled="' + task.IsEnabled + '">\r\n';
                                        for (let j = 0; j < task.Settings.length; j++) {
                                            let setting = task.Settings[j];
                                            if (setting.Value !== "") {
                                                xmlVal += '\t\t\t<Setting name="' + setting.Name + '" value="' + setting.Value + '" />\r\n';
                                            }
                                        }
                                        xmlVal += '\t\t</Task>\r\n';
                                    }
                                    xmlVal += '\t</Tasks>\r\n';
                                } else {
                                    xmlVal += '\t<Tasks />\r\n';
                                }

                                if (graph !== "<ExecutionGraph />") {
                                    xmlVal += graph + "\r\n";
                                }
                                xmlVal += '</Workflow>';

                                download(xmlVal, 'workflow-' + document.getElementById("wfid").value + '.xml', 'text/xml')

                                exportModal.close();
                            }, function () { }, auth);
                        }
                    };

                    let wfIdStr = document.getElementById("wfid").value;
                    if (isInt(wfIdStr)) {
                        let workflowId = parseInt(wfIdStr);

                        if (checkId === true) {
                            Common.get(uri + "/isWorkflowIdValid/" + workflowId,
                                function (res) {
                                    if (res === true) {
                                        if (document.getElementById("wfname").value === "") {
                                            Common.toastInfo("Enter a name for this workflow.");
                                            exportModal.close();
                                        } else {
                                            let lt = document.getElementById("wflaunchtype").value;
                                            if (lt === "") {
                                                Common.toastInfo("Select a launchType for this workflow.");
                                                exportModal.close();
                                            } else {
                                                if (lt === "periodic" && document.getElementById("wfperiod").value === "") {
                                                    Common.toastInfo("Enter a period for this workflow.");
                                                    exportModal.close();
                                                } else {
                                                    if (lt === "cron" && document.getElementById("wfcronexp").value === "") {
                                                        Common.toastInfo("Enter a cron expression for this workflow.");
                                                        exportModal.close();
                                                    } else {

                                                        // Period validation
                                                        if (lt === "periodic" && document.getElementById("wfperiod").value !== "") {
                                                            let period = document.getElementById("wfperiod").value;
                                                            Common.get(uri + "/isPeriodValid/" + period,
                                                                function (res) {
                                                                    if (res === true) {
                                                                        downloadXml();
                                                                    } else {
                                                                        Common.toastInfo("The period format is not valid. The valid format is: dd.hh:mm:ss");
                                                                        exportModal.close();
                                                                    }
                                                                },
                                                                function () { }, auth
                                                            );
                                                        } // Cron expression validation
                                                        else if (lt === "cron" && document.getElementById("wfcronexp").value !== "") {
                                                            let expression = document.getElementById("wfcronexp").value;
                                                            let expressionEncoded = encodeURIComponent(expression);

                                                            Common.get(uri + "/isCronExpressionValid?e=" + expressionEncoded,
                                                                function (res) {
                                                                    if (res === true) {
                                                                        downloadXml();
                                                                    } else {
                                                                        exportModal.close();
                                                                        if (confirm("The cron expression format is not valid.\nRead the documentation?")) {
                                                                            openInNewTab("https://github.com/aelassas/Wexflow/wiki/Cron-scheduling");
                                                                        }
                                                                    }
                                                                },
                                                                function () { }, auth
                                                            );
                                                        } else {
                                                            downloadXml();
                                                        }

                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        Common.toastInfo("The workflow id is already in use. Enter another one.");
                                    }
                                },
                                function () { }, auth);
                        } else {

                            if (document.getElementById("wfname").value === "") {
                                Common.toastInfo("Enter a name for this workflow.");
                                exportModal.close();
                            } else {
                                let lt = document.getElementById("wflaunchtype").value;
                                if (lt === "") {
                                    Common.toastInfo("Select a launchType for this workflow.");
                                    exportModal.close();
                                } else {
                                    if (lt === "periodic" && document.getElementById("wfperiod").value === "") {
                                        Common.toastInfo("Enter a period for this workflow.");
                                        exportModal.close();
                                    } else {
                                        if (lt === "cron" && document.getElementById("wfcronexp").value === "") {
                                            Common.toastInfo("Enter a cron expression for this workflow.");
                                            exportModal.close();
                                        } else {

                                            // Period validation
                                            if (lt === "periodic" && document.getElementById("wfperiod").value !== "") {
                                                let period = document.getElementById("wfperiod").value;
                                                Common.get(uri + "/isPeriodValid/" + period,
                                                    function (res) {
                                                        if (res === true) {
                                                            downloadXml();
                                                        } else {
                                                            Common.toastInfo("The period format is not valid. The valid format is: dd.hh:mm:ss");
                                                            exportModal.close();
                                                        }
                                                    },
                                                    function () { }, auth
                                                );
                                            } // Cron expression validation
                                            else if (lt === "cron" && document.getElementById("wfcronexp").value !== "") {
                                                let expression = document.getElementById("wfcronexp").value;
                                                let expressionEncoded = encodeURIComponent(expression);

                                                Common.get(uri + "/isCronExpressionValid?e=" + expressionEncoded,
                                                    function (res) {
                                                        if (res === true) {
                                                            downloadXml();
                                                        } else {
                                                            exportModal.close();
                                                            if (confirm("The cron expression format is not valid.\nRead the documentation?")) {
                                                                openInNewTab("https://github.com/aelassas/Wexflow/wiki/Cron-scheduling");
                                                            }
                                                        }
                                                    },
                                                    function () { }, auth
                                                );
                                            } else {
                                                downloadXml();
                                            }

                                        }
                                    }
                                }
                            }

                        }

                    } else {
                        Common.toastInfo("Enter a valid workflow id.");
                        exportModal.close();
                    }
                }
            };
        };

        function download(text, name, type) {
            let a = document.createElement("a");
            let file = new Blob([text], { type: type });
            let url = URL.createObjectURL(file);
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }

        document.getElementById("import").onclick = function () {
            let filedialog = document.getElementById("filedialog");
            filedialog.click();

            filedialog.onchange = function (e) {
                let file = e.target.files[0];
                let fd = new FormData();
                fd.append("file", file);

                Common.post(uri + "/upload", function (workflowId) {
                    if (workflowId > -1) {
                        if (json === true) {
                            Common.get(uri + "/json/" + workflowId,
                                function (val) {
                                    openJsonView(JSON.stringify(val, null, '\t'));
                                }, function () { }, auth);
                        } else if (xml === true) {
                            Common.get(uri + "/xml/" + workflowId,
                                function (val) {
                                    openXmlView(val);
                                }, function () { }, auth);
                        } else if (graph === true) {
                            openGraph(workflowId);
                        }

                        // load diagram
                        loadDiagram(workflowId);

                        filedialog.value = "";
                        Common.toastSuccess(file.name + " loaded with success.");
                    } else {
                        filedialog.value = "";
                        Common.toastError(file.name + " is not valid.");
                    }
                }, function () {
                    filedialog.value = "";
                    Common.toastError("An error occured while uploading the file " + file.name + ".");
                }, fd, auth, true);

            };

        };

        document.getElementById("wf-add-var").onclick = function () {

            let wfVarsTable = document.getElementsByClassName("wf-local-vars")[0];

            let row1 = wfVarsTable.insertRow(-1);
            let cell1_1 = row1.insertCell(0);
            let cell1_2 = row1.insertCell(1);
            let row2 = wfVarsTable.insertRow(-1);
            let cell2_1 = row2.insertCell(0);

            cell1_1.innerHTML = "<input class='form-control wf-var-key' type='text'>";
            cell1_2.innerHTML = "<button type='button' class='wf-remove-var btn btn-danger'>Delete</button>";
            cell2_1.innerHTML = "<input class='form-control wf-var-value' type='text'>";
            cell2_1.className = "wf-value";
            cell2_1.colSpan = 2;

            workflow.WorkflowInfo.LocalVariables.push({ "Key": "", "Value": "" });

            goToBottom("wfproplist");

            // events
            let index = workflow.WorkflowInfo.LocalVariables.length - 1;

            let wfVarKey = wfVarsTable.getElementsByClassName("wf-var-key")[index];
            wfVarKey.onkeyup = function () {
                let index = parseInt(getElementIndex(wfVarValue.parentElement.parentElement) / 2);
                workflow.WorkflowInfo.LocalVariables[index].Key = this.value;
            };

            let wfVarValue = wfVarsTable.getElementsByClassName("wf-var-value")[index];
            wfVarValue.onkeyup = function () {
                let index = parseInt(getElementIndex(wfVarValue.parentElement.parentElement) / 2);
                workflow.WorkflowInfo.LocalVariables[index].Value = this.value;
            };

            let btnVarDelete = wfVarsTable.getElementsByClassName("wf-remove-var")[index];
            btnVarDelete.onclick = function () {
                let res = confirm("Are you sure you want to delete this variable?");
                if (res === true) {
                    let index = parseInt(getElementIndex(wfVarValue.parentElement.parentElement) / 2);
                    workflow.WorkflowInfo.LocalVariables = deleteRow(workflow.WorkflowInfo.LocalVariables, index);
                    this.parentNode.parentNode.nextSibling.remove();
                    this.parentElement.parentElement.remove();
                    goToBottom("wfproplist");
                }
                return false;
            };
        };

        function deleteRow(arr, row) {
            arr = arr.slice(0); // make copy
            arr.splice(row, 1);
            return arr;
        }

        function getElementIndex(node) {
            let index = 0;
            while ((node = node.previousElementSibling)) {
                index++;
            }
            return index;
        }

        function goToBottom(id) {
            let element = document.getElementById(id);
            element.scrollTop = element.scrollHeight - element.clientHeight;
        }
    }

};