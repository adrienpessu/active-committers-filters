(function () {
    "use strict";

    var allUsers = [];
    var currentFiltered = [];
    var currentOrgStats = [];
    var repositoryFilter = "";

    var uploadArea = document.getElementById("uploadArea");
    var fileInput = document.getElementById("fileInput");
    var fileInfo = document.getElementById("fileInfo");
    var statsSection = document.getElementById("statsSection");
    var filterSection = document.getElementById("filterSection");
    var orgStatsSection = document.getElementById("orgStatsSection");
    var userDataSection = document.getElementById("userDataSection");
    var downloadSection = document.getElementById("downloadSection");
    var totalUsersEl = document.getElementById("totalUsers");
    var filteredUsersEl = document.getElementById("filteredUsers");
    var filteredRepositoriesEl = document.getElementById("filteredRepositories");
    var repoLabel = document.getElementById("repoLabel");
    var repositoriesTextarea = document.getElementById("repositories");
    var applyFilterBtn = document.getElementById("applyFilterBtn");
    var clearFilterBtn = document.getElementById("clearFilterBtn");
    var orgStatsBody = document.getElementById("orgStatsBody");
    var userDataInfo = document.getElementById("userDataInfo");
    var userDataBody = document.getElementById("userDataBody");
    var deduplicateToggle = document.getElementById("deduplicateToggle");
    var deduplicateInfo = document.getElementById("deduplicateInfo");
    var downloadBtn = document.getElementById("downloadBtn");
    var downloadOrgStatsBtn = document.getElementById("downloadOrgStatsBtn");

    function parseCSVLine(line) {
        var result = [];
        var current = "";
        var inQuotes = false;
        for (var i = 0; i < line.length; i++) {
            var ch = line[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ",") {
                    result.push(current);
                    current = "";
                } else {
                    current += ch;
                }
            }
        }
        result.push(current);
        return result;
    }

    function parseCSV(text) {
        var lines = text.split(/\r?\n/).filter(function (l) { return l.trim() !== ""; });
        if (lines.length < 2) return [];
        var header = parseCSVLine(lines[0]);
        if (header.length < 4) return [];
        var users = [];
        for (var i = 1; i < lines.length; i++) {
            var fields = parseCSVLine(lines[i]);
            if (fields.length >= 4) {
                users.push({
                    login: fields[0].trim(),
                    repository: fields[1].trim(),
                    lastPushed: fields[2].trim(),
                    lastEmail: fields[3].trim()
                });
            }
        }
        return users;
    }

    function countUniqueUsers(users) {
        var set = {};
        users.forEach(function (u) { set[u.login] = true; });
        return Object.keys(set).length;
    }

    function countUniqueRepositories(users) {
        var set = {};
        users.forEach(function (u) { set[u.repository] = true; });
        return Object.keys(set).length;
    }

    function filterUsersByRepository(users, repoText) {
        if (!repoText.trim()) return users;
        var repoMap = {};
        repoText.split("\n").forEach(function (r) {
            var trimmed = r.trim();
            if (trimmed) repoMap[trimmed] = true;
        });
        if (Object.keys(repoMap).length === 0) return users;
        return users.filter(function (u) { return repoMap[u.repository]; });
    }

    function extractOrganization(repository) {
        var parts = repository.split("/");
        return parts.length > 0 ? parts[0] : repository;
    }

    function calculateOrgStats(users) {
        var userToOrg = {};
        users.forEach(function (u) {
            var org = extractOrganization(u.repository);
            if (!userToOrg[u.login]) userToOrg[u.login] = org;
        });
        var orgUsers = {};
        Object.keys(userToOrg).forEach(function (login) {
            var org = userToOrg[login];
            if (!orgUsers[org]) orgUsers[org] = {};
            orgUsers[org][login] = true;
        });
        var stats = Object.keys(orgUsers).map(function (org) {
            return { organization: org, userCount: Object.keys(orgUsers[org]).length };
        });
        stats.sort(function (a, b) {
            if (a.userCount !== b.userCount) return b.userCount - a.userCount;
            return a.organization.localeCompare(b.organization);
        });
        return stats;
    }

    function deduplicateUsers(users) {
        var map = {};
        users.forEach(function (u) {
            if (!map[u.login] || u.lastPushed > map[u.login].lastPushed) {
                map[u.login] = u;
            }
        });
        return Object.keys(map).map(function (k) { return map[k]; });
    }

    function renderUserTable(users) {
        userDataBody.innerHTML = "";
        users.forEach(function (u) {
            var tr = document.createElement("tr");
            [u.login, u.repository, u.lastPushed, u.lastEmail].forEach(function (val) {
                var td = document.createElement("td");
                td.textContent = val;
                tr.appendChild(td);
            });
            userDataBody.appendChild(tr);
        });
    }

    function showDataSections() {
        statsSection.classList.add("visible");
        filterSection.classList.add("visible");
        orgStatsSection.classList.add("visible");
        userDataSection.classList.add("visible");
        downloadSection.classList.add("visible");
    }

    function render() {
        currentFiltered = filterUsersByRepository(allUsers, repositoryFilter);
        var totalU = countUniqueUsers(allUsers);
        var filteredU = countUniqueUsers(currentFiltered);
        var filteredR = countUniqueRepositories(currentFiltered);
        currentOrgStats = calculateOrgStats(currentFiltered);

        totalUsersEl.textContent = totalU;
        filteredUsersEl.textContent = filteredU;
        filteredRepositoriesEl.textContent = filteredR;

        orgStatsBody.innerHTML = "";
        currentOrgStats.forEach(function (s) {
            var tr = document.createElement("tr");
            var tdOrg = document.createElement("td");
            tdOrg.style.fontWeight = "600";
            tdOrg.textContent = s.organization;
            var tdCount = document.createElement("td");
            var badge = document.createElement("span");
            badge.className = "badge";
            badge.textContent = s.userCount;
            tdCount.appendChild(badge);
            tr.appendChild(tdOrg);
            tr.appendChild(tdCount);
            orgStatsBody.appendChild(tr);
        });

        if (repositoryFilter.trim()) {
            userDataInfo.style.color = "#667eea";
            userDataInfo.style.fontWeight = "500";
            userDataInfo.textContent = "\uD83D\uDCCA Showing " + currentFiltered.length + " records filtered by repository criteria (" + filteredU + " unique users, " + filteredR + " unique repositories)";
        } else {
            userDataInfo.style.color = "#6c757d";
            userDataInfo.style.fontWeight = "normal";
            userDataInfo.textContent = "\uD83D\uDCCB Showing all " + currentFiltered.length + " records (" + totalU + " unique users, " + countUniqueRepositories(allUsers) + " unique repositories)";
        }

        deduplicateToggle.checked = false;
        deduplicateInfo.style.display = "none";
        renderUserTable(currentFiltered);
        clearFilterBtn.style.display = repositoryFilter.trim() ? "block" : "none";
    }

    function handleFile(file) {
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            allUsers = parseCSV(e.target.result);
            if (allUsers.length === 0) {
                fileInfo.textContent = "\u26A0\uFE0F No valid data found. Ensure CSV has header: User login,Organization / repository,Last pushed date,Last pushed email";
                fileInfo.style.display = "block";
                fileInfo.style.background = "#fff3e0";
                fileInfo.style.color = "#e65100";
                return;
            }
            fileInfo.textContent = "\u2705 Loaded " + file.name + " \u2014 " + allUsers.length + " records";
            fileInfo.style.display = "block";
            fileInfo.style.background = "#e8f5e9";
            fileInfo.style.color = "#2e7d32";
            repositoryFilter = "";
            repositoriesTextarea.value = "";
            showDataSections();
            render();
        };
        reader.readAsText(file);
    }

    uploadArea.addEventListener("click", function () { fileInput.click(); });
    fileInput.addEventListener("change", function () {
        if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
    });
    uploadArea.addEventListener("dragover", function (e) {
        e.preventDefault();
        uploadArea.classList.add("dragover");
    });
    uploadArea.addEventListener("dragleave", function () {
        uploadArea.classList.remove("dragover");
    });
    uploadArea.addEventListener("drop", function (e) {
        e.preventDefault();
        uploadArea.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    applyFilterBtn.addEventListener("click", function () {
        repositoryFilter = repositoriesTextarea.value;
        render();
    });

    clearFilterBtn.addEventListener("click", function () {
        repositoryFilter = "";
        repositoriesTextarea.value = "";
        updateRepoCount();
        render();
    });

    repositoriesTextarea.addEventListener("input", updateRepoCount);

    function updateRepoCount() {
        var value = repositoriesTextarea.value.trim();
        var repos = value.split("\n").filter(function (l) { return l.trim() !== ""; });
        var countText = "";
        if (repos.length > 0) {
            countText = " (" + repos.length + (repos.length === 1 ? " repository" : " repositories") + ")";
        }
        repoLabel.textContent = "Repositories Filtered:" + countText;
    }

    deduplicateToggle.addEventListener("change", function () {
        if (this.checked) {
            var deduped = deduplicateUsers(currentFiltered);
            renderUserTable(deduped);
            deduplicateInfo.style.display = "inline";
            deduplicateInfo.textContent = "\uD83D\uDC64 Showing " + deduped.length + " unique users";
        } else {
            renderUserTable(currentFiltered);
            deduplicateInfo.style.display = "none";
        }
    });

    function downloadCSV(rows, filename) {
        var csv = rows.map(function (r) {
            return r.map(function (field) {
                if (field.indexOf(",") !== -1 || field.indexOf('"') !== -1 || field.indexOf("\n") !== -1) {
                    return '"' + field.replace(/"/g, '""') + '"';
                }
                return field;
            }).join(",");
        }).join("\n");
        var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        var link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    downloadOrgStatsBtn.addEventListener("click", function () {
        var rows = [["Organization", "Active Committers"]];
        currentOrgStats.forEach(function (s) {
            rows.push([s.organization, String(s.userCount)]);
        });
        downloadCSV(rows, "org-stats.csv");
    });

    downloadBtn.addEventListener("click", function () {
        var rows = [["User login", "Organization / repository", "Last pushed date", "Last pushed email"]];
        var data = deduplicateToggle.checked ? deduplicateUsers(currentFiltered) : currentFiltered;
        data.forEach(function (u) {
            rows.push([u.login, u.repository, u.lastPushed, u.lastEmail]);
        });
        downloadCSV(rows, "filtered-committers.csv");
    });
})();
