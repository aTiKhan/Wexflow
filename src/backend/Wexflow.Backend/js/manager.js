function WexflowManager() {
    "use strict";

    var id = "wf-manager";
    var uri = Common.trimEnd(Settings.Uri, "/");
    var lnkManager = document.getElementById("lnk-manager");
    var lnkDesigner = document.getElementById("lnk-designer");
    //var lnkEditor = document.getElementById("lnk-editor");
    //var lnkApproval = document.getElementById("lnk-approval");
    var lnkUsers = document.getElementById("lnk-users");
    var lnkProfiles = document.getElementById("lnk-profiles");
    var selectedId = -1;
    var workflows = {};
    let jobs = [];
    let workflowJobs = {};
    var workflowTimer = null;
    let jobTimer = null;
    var timerInterval = 1000; // ms
    var username = "";
    var password = "";
    var auth = "";

    var html = "<div id='wf-container'>"
        + "<div id='wf-cmd'>"
        + "<button id='wf-start' type='button' class='btn btn-primary btn-xs'>Start</button>"
        + "<button id='wf-pause' type='button' class='btn btn-secondary btn-xs'>Suspend</button>"
        + "<button id='wf-resume' type='button' class='btn btn-secondary btn-xs'>Resume</button>"
        + "<button id='wf-stop' type='button' class='btn btn-danger btn-xs'>Stop</button>"
        + "<button id='wf-approve' type='button' class='btn btn-primary btn-xs'>Approve</button>"
        + "<button id='wf-reject' type='button' class='btn btn-warning btn-xs'>Reject</button>"
        + "</div>"
        + "<div id='wf-notifier'>"
        + "<input id='wf-notifier-text' type='text' name='fname' readonly>"
        + "</div>"
        + "<div id='wf-search'>"
        + "<div id='wf-search-text-container'>"
        + "<input id='wf-search-text' type='text' name='fname'>"
        + "</div>"
        + "<button id='wf-search-action' type='button' class='btn btn-primary btn-xs'>Search</button>"
        + "</div>"
        + "<div id='wf-jobs'>"
        + "<table id='wf-jobs-table' class='table'>"
        + "<thead class='thead-dark'>"
        + "<tr>"
        + "<th class='wf-jobId'>Job Id</th>"
        + "<th class='wf-startedOn'>Started On</th>"
        + "<th class='wf-n'>Name</th>"
        + "<th class='wf-d'>Description</th>"
        + "</tr>"
        + "</thead>"
        + "<tbody>"
        + "</tbody>"
        + "</table>"
        + "</div>"
        + "<div id='wf-workflows'>"
        + "</div>"
        + "</div>";

    document.getElementById(id).innerHTML = html;

    var startButton = document.getElementById("wf-start");
    var suspendButton = document.getElementById("wf-pause");
    var resumeButton = document.getElementById("wf-resume");
    var stopButton = document.getElementById("wf-stop");
    var approveButton = document.getElementById("wf-approve");
    var rejectButton = document.getElementById("wf-reject");
    var searchButton = document.getElementById("wf-search-action");
    var searchText = document.getElementById("wf-search-text");
    var suser = getUser();


    if (suser === null || suser === "") {
        Common.redirectToLoginPage();
    } else {
        var user = JSON.parse(suser);

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

                        var btnLogout = document.getElementById("btn-logout");
                        var divWorkflows = document.getElementById("wf-manager");
                        divWorkflows.style.display = "block";

                        btnLogout.onclick = function () {
                            deleteUser();
                            Common.redirectToLoginPage();
                        };
                        btnLogout.innerHTML = "Logout (" + u.Username + ")";

                        Common.disableButton(startButton, true);
                        Common.disableButton(suspendButton, true);
                        Common.disableButton(resumeButton, true);
                        Common.disableButton(stopButton, true);
                        Common.disableButton(approveButton, true);
                        Common.disableButton(rejectButton, true);

                        searchButton.onclick = function () {
                            loadWorkflows();
                            notify("");
                            Common.disableButton(startButton, true);
                            Common.disableButton(suspendButton, true);
                            Common.disableButton(resumeButton, true);
                            Common.disableButton(stopButton, true);
                            Common.disableButton(approveButton, true);
                            Common.disableButton(rejectButton, true);
                        };

                        searchText.onkeyup = function (event) {
                            event.preventDefault();

                            if (event.keyCode === 13) { // Enter
                                loadWorkflows();
                                notify("");
                                Common.disableButton(startButton, true);
                                Common.disableButton(suspendButton, true);
                                Common.disableButton(resumeButton, true);
                                Common.disableButton(stopButton, true);
                                Common.disableButton(approveButton, true);
                                Common.disableButton(rejectButton, true);
                            }
                        };

                        loadWorkflows();
                    } else {
                        Common.redirectToLoginPage();
                    }

                }
            },
            function () { }, auth);
    }

    function compareById(wf1, wf2) {
        if (wf1.Id < wf2.Id) {
            return -1;
        } else if (wf1.Id > wf2.Id) {
            return 1;
        }
        return 0;
    }

    function launchType(lt) {
        switch (lt) {
            case 0:
                return "Startup";
            case 1:
                return "Trigger";
            case 2:
                return "Periodic";
            case 3:
                return "Cron";
            default:
                return "";
        }
    }

    function loadWorkflows() {
        Common.get(uri + "/search?s=" + encodeURIComponent(searchText.value),
            function (data) {
                data.sort(compareById);
                var items = [];
                var i;
                for (i = 0; i < data.length; i++) {
                    var val = data[i];
                    workflows[val.Id] = val;
                    var lt = launchType(val.LaunchType);
                    items.push("<tr>"
                        + "<td class='wf-id' title='" + val.Id + "'>" + val.Id + "</td>"
                        + "<td class='wf-n' title='" + val.Name + "'>" + val.Name + "</td>"
                        + "<td class='wf-lt'>" + lt + "</td>"
                        + "<td class='wf-e'><input type='checkbox' readonly disabled " + (val.IsEnabled ? "checked" : "") + "></input></td>"
                        + "<td class='wf-a'><input type='checkbox' readonly disabled " + (val.IsApproval ? "checked" : "") + "></input></td>"
                        + "<td class='wf-d' title='" + val.Description + "'>" + val.Description + "</td>"
                        + "</tr>");

                }

                var table = "<table id='wf-workflows-table' class='table'>"
                    + "<thead class='thead-dark'>"
                    + "<tr>"
                    + "<th class='wf-id'>Id</th>"
                    + "<th class='wf-n'>Name</th>"
                    + "<th class='wf-lt'>LaunchType</th>"
                    + "<th class='wf-e'>Enabled</th>"
                    + "<th class='wf-a'>Approval</th>"
                    + "<th class='wf-d'>Description</th>"
                    + "</tr>"
                    + "</thead>"
                    + "<tbody>"
                    + items.join("")
                    + "</tbody>"
                    + "</table>";

                let divWorkflows = document.getElementById("wf-workflows");
                divWorkflows.innerHTML = table;

                var workflowsTable = document.getElementById("wf-workflows-table");

                workflowsTable.getElementsByTagName("tbody")[0].style.height = (divWorkflows.offsetHeight - 45) + "px";

                var rows = workflowsTable.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
                if (rows.length > 0) {
                    var hrow = workflowsTable.getElementsByTagName("thead")[0].getElementsByTagName("tr")[0];
                    hrow.querySelector(".wf-id").style.width = rows[0].querySelector(".wf-id").offsetWidth + "px";
                    hrow.querySelector(".wf-n").style.width = rows[0].querySelector(".wf-n").offsetWidth + "px";
                    hrow.querySelector(".wf-e").style.width = rows[0].querySelector(".wf-e").offsetWidth + "px";
                    hrow.querySelector(".wf-a").style.width = rows[0].querySelector(".wf-a").offsetWidth + "px";
                    hrow.querySelector(".wf-d").style.width = rows[0].querySelector(".wf-d").offsetWidth + "px";
                }

                var descriptions = workflowsTable.querySelectorAll(".wf-d");
                for (i = 0; i < descriptions.length; i++) {
                    descriptions[i].style.width = workflowsTable.offsetWidth - 515 + "px";
                }

                function getWorkflow(wid, func) {
                    Common.get(uri + "/workflow?w=" + wid, function (d) {
                        func(d);
                    },
                        function () { }, auth);
                }

                function updateButtons(wid, force) {
                    getWorkflow(wid, function (workflow) {
                        if (workflow.IsEnabled === false) {
                            notify("This workflow is disabled.");
                            Common.disableButton(startButton, true);
                            Common.disableButton(suspendButton, true);
                            Common.disableButton(resumeButton, true);
                            Common.disableButton(stopButton, true);
                            Common.disableButton(approveButton, true);
                            Common.disableButton(rejectButton, true);
                            clearInterval(workflowTimer);
                        }
                        else {
                            if (force === false && workflowStatusChanged(workflow) === false) return;

                            Common.disableButton(startButton, false);

                            notify("");
                        }
                    });
                }

                function workflowStatusChanged(workflow) {
                    var changed = workflows[workflow.Id].IsEnabled !== workflow.IsEnabled;
                    workflows[workflow.Id].IsEnabled = workflow.IsEnabled;
                    return changed;
                }

                function updateJobButtons(wid, jobId, force) {
                    Common.get(uri + "/job?w=" + wid + "&i=" + jobId, function (job) {
                        if (job) {
                            if (force === false && jobStatusChanged(job) === false) return;

                            Common.disableButton(stopButton, !(job.IsRunning && !job.IsPaused));
                            Common.disableButton(suspendButton, !(job.IsRunning && !job.IsPaused));
                            Common.disableButton(resumeButton, !job.IsPaused);
                            Common.disableButton(approveButton, !(job.IsWaitingForApproval && job.IsApproval));
                            Common.disableButton(rejectButton, !(job.IsWaitingForApproval && job.IsApproval));

                            if (job.IsApproval === true && job.IsWaitingForApproval === true && job.IsPaused === false) {
                                notify("This job is waiting for approval...");
                            } else {
                                if (job.IsRunning === true && job.IsPaused === false) {
                                    notify("This job is running...");
                                }
                                else if (job.IsPaused === true) {
                                    notify("This job is suspended.");
                                } else {
                                    notify("");
                                }
                            }
                        } else {
                            clearInterval(jobTimer);
                            Common.disableButton(stopButton, true);
                            Common.disableButton(suspendButton, true);
                            Common.disableButton(resumeButton, true);
                            notify("");
                        }
                    }, function () { }, auth);
                }

                function jobStatusChanged(job) {
                    if (!job || !workflowJobs[job.InstanceId]) {
                        return true;
                    }
                    var changed = workflowJobs[job.InstanceId].IsRunning !== job.IsRunning || workflowJobs[job.InstanceId].IsPaused !== job.IsPaused || workflowJobs[job.InstanceId].IsWaitingForApproval !== job.IsWaitingForApproval;
                    workflowJobs[job.InstanceId].IsRunning = job.IsRunning;
                    workflowJobs[job.InstanceId].IsPaused = job.IsPaused;
                    workflowJobs[job.InstanceId].IsWaitingForApproval = job.IsWaitingForApproval;
                    return changed;
                }

                var rows = (workflowsTable.getElementsByTagName("tbody")[0]).getElementsByTagName("tr");
                for (i = 0; i < rows.length; i++) {
                    rows[i].onclick = function () {
                        selectedId = parseInt(this.getElementsByClassName("wf-id")[0].innerHTML);

                        var selected = workflowsTable.querySelectorAll(".selected");
                        if (selected.length > 0) {
                            selected[0].classList.remove("selected");
                        }

                        this.className += "selected";

                        let jobsTable = document.getElementById("wf-jobs-table");
                        jobsTable.getElementsByTagName("tbody")[0].style.height = (document.getElementById("wf-jobs").offsetHeight - 45) + "px";

                        clearInterval(workflowTimer);

                        if (workflows[selectedId].IsEnabled === true) {
                            workflowTimer = setInterval(function () {
                                updateButtons(selectedId, false);

                                // Jobs
                                Common.get(uri + "/jobs?w=" + selectedId, function (data) {
                                    if (data) {
                                        workflowJobs = {};
                                        let currentJobs = [];
                                        for (let i = 0; i < data.length; i++) {
                                            let job = data[i];
                                            currentJobs.push(job.InstanceId);
                                            workflowJobs[job.InstanceId] = job;
                                        }

                                        for (let i = 0; i < currentJobs.length; i++) {
                                            let jobId = currentJobs[i];

                                            if (jobs.includes(jobId) === false) {
                                                // Add
                                                var row = jobsTable.getElementsByTagName('tbody')[0].insertRow();

                                                for (let i = 0; i < data.length; i++) {
                                                    var job = data[i];
                                                    if (job.InstanceId === jobId) {
                                                        var cell1 = row.insertCell(0);
                                                        var cell2 = row.insertCell(1);
                                                        var cell3 = row.insertCell(2);
                                                        var cell4 = row.insertCell(3);
                                                        cell1.className = "wf-jobId";
                                                        cell1.innerHTML = job.InstanceId;
                                                        cell2.className = "wf-startedOn";
                                                        cell2.innerHTML = job.StartedOn;
                                                        cell3.className = "wf-n";
                                                        cell3.innerHTML = job.Name;
                                                        cell4.className = "wf-d";
                                                        cell4.innerHTML = job.Description;
                                                        break;
                                                    }
                                                }

                                                //let rows = (jobsTable.getElementsByTagName("tbody")[0]).getElementsByTagName("tr");
                                                //if (rows.length > 0) {
                                                //    var hrow = jobsTable.getElementsByTagName("thead")[0].getElementsByTagName("tr")[0];
                                                //    hrow.querySelector(".wf-jobId").style.width = rows[0].querySelector(".wf-jobId").offsetWidth + "px";
                                                //    hrow.querySelector(".wf-startedOn").style.width = rows[0].querySelector(".wf-startedOn").offsetWidth + "px";
                                                //    hrow.querySelector(".wf-n").style.width = rows[0].querySelector(".wf-n").offsetWidth + "px";
                                                //    hrow.querySelector(".wf-d").style.width = rows[0].querySelector(".wf-d").offsetWidth + "px";
                                                //}

                                                let descriptions = jobsTable.querySelectorAll(".wf-d");
                                                for (let i = 0; i < descriptions.length; i++) {
                                                    descriptions[i].style.width = workflowsTable.offsetWidth - 515 + "px";
                                                }

                                                jobs.push(jobId);
                                            } else {
                                                for (let j = 0; j < jobs.length; j++) {
                                                    if (currentJobs.includes(jobs[j]) === false) {
                                                        // Remove
                                                        let rows = (jobsTable.getElementsByTagName("tbody")[0]).getElementsByTagName("tr");
                                                        for (let k = 0; k < rows.length; k++) {
                                                            let row = rows[k];
                                                            let jobId = row.querySelector(".wf-jobId").innerHTML;
                                                            if (jobId === jobs[j]) {
                                                                jobsTable.deleteRow(k + 1);

                                                                break;
                                                            }
                                                        }

                                                        //if (rows.length > 0) {
                                                        //    var hrow = jobsTable.getElementsByTagName("thead")[0].getElementsByTagName("tr")[0];
                                                        //    hrow.querySelector(".wf-jobId").style.width = rows[0].querySelector(".wf-jobId").offsetWidth + "px";
                                                        //    hrow.querySelector(".wf-startedOn").style.width = rows[0].querySelector(".wf-startedOn").offsetWidth + "px";
                                                        //    hrow.querySelector(".wf-n").style.width = rows[0].querySelector(".wf-n").offsetWidth + "px";
                                                        //    hrow.querySelector(".wf-d").style.width = rows[0].querySelector(".wf-d").offsetWidth + "px";
                                                        //}

                                                        let descriptions = jobsTable.querySelectorAll(".wf-d");
                                                        for (let i = 0; i < descriptions.length; i++) {
                                                            descriptions[i].style.width = workflowsTable.offsetWidth - 515 + "px";
                                                        }

                                                        remove(jobs, jobs[j]);
                                                    }
                                                }
                                            }
                                        }

                                        if (currentJobs.length === 0) {
                                            (jobsTable.getElementsByTagName("tbody")[0]).innerHTML = '';
                                            jobs = [];
                                        }

                                        // On row click
                                        let rows = (jobsTable.getElementsByTagName("tbody")[0]).getElementsByTagName("tr");
                                        for (let k = 0; k < rows.length; k++) {
                                            let row = rows[k];
                                            row.onclick = function () {
                                                let jobId = row.querySelector(".wf-jobId").innerHTML;

                                                let selected = jobsTable.getElementsByTagName("tbody")[0].querySelectorAll(".selected");
                                                if (selected.length > 0) {
                                                    selected[0].classList.remove("selected");
                                                }

                                                this.className += "selected";

                                                if (jobTimer) {
                                                    clearInterval(jobTimer);
                                                }

                                                jobTimer = setInterval(function () {
                                                    updateJobButtons(selectedId, jobId, false);

                                                }, timerInterval);

                                                updateJobButtons(selectedId, jobId, true);

                                            };
                                        }
                                    }
                                }, function () {
                                }, auth);

                            }, timerInterval);

                            updateButtons(selectedId, true);
                        } else {
                            updateButtons(selectedId, true);
                        }

                    };
                }

                startButton.onclick = function () {
                    var startUri = uri + "/start?w=" + selectedId;
                    Common.post(startUri, function (res) {
                    }, function () { }, "", auth);
                };

                suspendButton.onclick = function () {
                    let selectedJob = document.getElementById("wf-jobs-table").querySelector(".selected");
                    let jobId = selectedJob.querySelector(".wf-jobId").innerHTML;

                    var suspendUri = uri + "/suspend?w=" + selectedId + "&i=" + jobId;
                    Common.post(suspendUri, function (res) {
                        if (res === true) {
                            updateJobButtons(selectedId, jobId, true);
                        } else {
                            Common.toastInfo("This operation is not supported.");
                        }
                    }, function () { }, "", auth);
                };

                resumeButton.onclick = function () {
                    let selectedJob = document.getElementById("wf-jobs-table").querySelector(".selected");
                    let jobId = selectedJob.querySelector(".wf-jobId").innerHTML;

                    var resumeUri = uri + "/resume?w=" + selectedId + "&i=" + jobId;
                    Common.post(resumeUri, function () {
                        updateJobButtons(selectedId, jobId, true);
                    }, function () { }, "", auth);
                };

                stopButton.onclick = function () {
                    let selectedJob = document.getElementById("wf-jobs-table").querySelector(".selected");
                    let jobId = selectedJob.querySelector(".wf-jobId").innerHTML;

                    var stopUri = uri + "/stop?w=" + selectedId + "&i=" + jobId;
                    Common.post(stopUri,
                        function (res) {
                            if (res === true) {
                                updateJobButtons(selectedId, jobId, true);
                            } else {
                                Common.toastInfo("This operation is not supported.");
                            }
                        },
                        function () { }, "", auth);
                };

                approveButton.onclick = function () {
                    Common.disableButton(approveButton, true);
                    Common.disableButton(stopButton, true);
                    let selectedJob = document.getElementById("wf-jobs-table").querySelector(".selected");
                    let jobId = selectedJob.querySelector(".wf-jobId").innerHTML;
                    let approveUri = uri + "/approve?w=" + selectedId + "&i=" + jobId;
                    Common.post(approveUri,
                        function (res) {
                            if (res === true) {
                                updateJobButtons(selectedId, jobId, true);
                                Common.toastSuccess("The job " + jobId + " was approved.");
                            } else {
                                Common.disableButton(approveButton, false);
                                Common.disableButton(stopButton, false);
                                Common.toastError("An error occured while approving the job " + jobId + " of the workflow " + selectedId + ".");
                            }
                        },
                        function () { }, "", auth);
                };

                rejectButton.onclick = function () {
                    Common.disableButton(rejectButton, true);
                    Common.disableButton(approveButton, true);
                    Common.disableButton(stopButton, true);
                    let selectedJob = document.getElementById("wf-jobs-table").querySelector(".selected");
                    let jobId = selectedJob.querySelector(".wf-jobId").innerHTML;
                    let rejectUri = uri + "/reject?w=" + selectedId + "&i=" + jobId;
                    Common.post(rejectUri,
                        function (res) {
                            if (res === true) {
                                updateJobButtons(selectedId, jobId, true);
                                Common.toastSuccess("The job " + jobId + " was rejected.");
                            } else {
                                Common.disableButton(disapproveButton, true);
                                Common.disableButton(approveButton, false);
                                Common.disableButton(stopButton, false);
                                Common.toastError("An error occured while rejecting the job " + jobId + " of the workflow " + selectedId + ".");
                            }
                        },
                        function () { }, "", auth);
                };

                // End of get workflows
            },
            function () {
                Common.toastError("An error occured while retrieving workflows. Check that Wexflow server is running correctly.");
            }, auth);
    }

    function notify(msg) {
        document.getElementById("wf-notifier-text").value = msg;
    }

    function remove(array, e) {
        const index = array.indexOf(e);
        if (index > -1) {
            array.splice(index, 1);
        }
    }
}