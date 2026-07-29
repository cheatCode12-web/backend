(function () {
  "use strict";

  var isLocalPreview = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(window.location.hostname);
  if (!isLocalPreview) return;

  var NativeXHR = window.XMLHttpRequest;
  var previewKey = "pulse_preview_state_v1";
  var userStorageKey = "bailord_user";
  var logoutKey = "bailord_user_logged_out";
  var apiPrefix = "https://bailordpulse.com/backend/api";
  var apiPathPrefix = "/backend/api";

  function iso(offsetDays) {
    var date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString();
  }

  function dateOnly(offsetDays) {
    return iso(offsetDays).slice(0, 10);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function defaultState() {
    return {
      currentUser: {
        id: "1",
        name: "Moses Bailord",
        email: "moses@bailordpulse.com",
        role: "staff",
        phone: "+234 800 000 0000"
      },
      users: [
        { id: 1, name: "Moses Bailord", email: "moses@bailordpulse.com", role: "staff", company: "Bailord Limited", status: "active" },
        { id: 2, name: "Adaeze Okafor", email: "adaeze@freshmart.ng", role: "retailer", company: "FreshMart Superstore", businessName: "FreshMart Superstore", status: "active" },
        { id: 3, name: "Chinedu Balogun", email: "chinedu@primehub.ng", role: "retailer", company: "PrimeHub Stores", businessName: "PrimeHub Stores", status: "active" },
        { id: 4, name: "Amina Yusuf", email: "amina@citybasket.ng", role: "retailer", company: "CityBasket Retail", businessName: "CityBasket Retail", status: "active" },
        { id: 5, name: "Tola Adeyemi", email: "tola@bailordpulse.com", role: "staff", company: "Bailord Limited", status: "active" }
      ],
      retailers: [
        {
          id: 101,
          name: "Adaeze Okafor",
          email: "adaeze@freshmart.ng",
          phone: "+234 801 111 2222",
          address: { street: "12 Admiralty Way", city: "Lekki", state: "Lagos", zipCode: "100001", country: "Nigeria" },
          businessName: "FreshMart Superstore",
          businessType: "Supermarket",
          registrationNumber: "FM-2231",
          status: "active",
          joinedDate: dateOnly(-120),
          bankDetails: { bankName: "GTBank", accountNumber: "0123456789", accountName: "FreshMart Superstore" },
          metrics: { totalSales: 2450000, totalOrders: 182, averageRating: 4.7 },
          projects: 3,
          createdAt: iso(-120),
          updatedAt: iso(-2)
        },
        {
          id: 102,
          name: "Chinedu Balogun",
          email: "chinedu@primehub.ng",
          phone: "+234 802 222 3333",
          address: { street: "4 Allen Avenue", city: "Ikeja", state: "Lagos", zipCode: "100271", country: "Nigeria" },
          businessName: "PrimeHub Stores",
          businessType: "Wholesale",
          registrationNumber: "PH-3840",
          status: "pending",
          joinedDate: dateOnly(-42),
          bankDetails: { bankName: "Access Bank", accountNumber: "2233445566", accountName: "PrimeHub Stores" },
          metrics: { totalSales: 890000, totalOrders: 64, averageRating: 4.2 },
          projects: 2,
          createdAt: iso(-42),
          updatedAt: iso(-5)
        },
        {
          id: 103,
          name: "Amina Yusuf",
          email: "amina@citybasket.ng",
          phone: "+234 803 333 4444",
          address: { street: "19 GRA Road", city: "Port Harcourt", state: "Rivers", zipCode: "500001", country: "Nigeria" },
          businessName: "CityBasket Retail",
          businessType: "Convenience",
          registrationNumber: "CB-9911",
          status: "active",
          joinedDate: dateOnly(-75),
          bankDetails: { bankName: "UBA", accountNumber: "3344556677", accountName: "CityBasket Retail" },
          metrics: { totalSales: 1740000, totalOrders: 121, averageRating: 4.5 },
          projects: 1,
          createdAt: iso(-75),
          updatedAt: iso(-1)
        },
        {
          id: 104,
          name: "Ifeoma Nwosu",
          email: "ifeoma@greenline.ng",
          phone: "+234 804 444 5555",
          address: { street: "7 Stadium Road", city: "Enugu", state: "Enugu", zipCode: "400001", country: "Nigeria" },
          businessName: "GreenLine Essentials",
          businessType: "Pharmacy",
          registrationNumber: "GL-5520",
          status: "inactive",
          joinedDate: dateOnly(-210),
          bankDetails: { bankName: "Zenith Bank", accountNumber: "5566778899", accountName: "GreenLine Essentials" },
          metrics: { totalSales: 520000, totalOrders: 39, averageRating: 3.9 },
          projects: 0,
          createdAt: iso(-210),
          updatedAt: iso(-22)
        }
      ],
      projects: [
        {
          id: 201,
          name: "Q2 Market Expansion",
          description: "Expand product placement across priority retail locations and support retailer activation.",
          start_date: dateOnly(-20),
          end_date: dateOnly(28),
          startDate: dateOnly(-20),
          endDate: dateOnly(28),
          status: "ongoing",
          progress: 68,
          assigned_retailers: 3,
          assignedRetailers: 3,
          user_id: 1
        },
        {
          id: 202,
          name: "Retailer Onboarding Sprint",
          description: "Bring newly approved retailers into the platform with documentation and launch support.",
          start_date: dateOnly(-9),
          end_date: dateOnly(12),
          startDate: dateOnly(-9),
          endDate: dateOnly(12),
          status: "ongoing",
          progress: 41,
          assigned_retailers: 2,
          assignedRetailers: 2,
          user_id: 1
        },
        {
          id: 203,
          name: "Lagos Visibility Campaign",
          description: "Improve in-store execution and measure retailer performance during the monthly campaign run.",
          start_date: dateOnly(-40),
          end_date: dateOnly(-4),
          startDate: dateOnly(-40),
          endDate: dateOnly(-4),
          status: "completed",
          progress: 100,
          assigned_retailers: 2,
          assignedRetailers: 2,
          user_id: 1
        }
      ],
      projectRetailers: {
        "201": [101, 102, 103],
        "202": [102, 103],
        "203": [101, 104]
      },
      messages: [
        { id: 301, sender_id: 2, recipient_id: 1, content: "We have completed shelf setup for the new display.", is_read: 0, created_at: iso(-1.2), updated_at: iso(-1.2) },
        { id: 302, sender_id: 1, recipient_id: 2, content: "Great. Please send photos so we can log completion.", is_read: 1, created_at: iso(-1.15), updated_at: iso(-1.15) },
        { id: 303, sender_id: 3, recipient_id: 1, content: "We need confirmation on the revised delivery date.", is_read: 0, created_at: iso(-0.8), updated_at: iso(-0.8) },
        { id: 304, sender_id: 1, recipient_id: 3, content: "Confirmed. We will close the schedule update this afternoon.", is_read: 1, created_at: iso(-0.6), updated_at: iso(-0.6) },
        { id: 305, sender_id: 4, recipient_id: 1, content: "Our team is ready for onboarding training next week.", is_read: 0, created_at: iso(-0.25), updated_at: iso(-0.25) }
      ]
    };
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(previewKey);
      if (!raw) return defaultState();
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : defaultState();
    } catch (error) {
      return defaultState();
    }
  }

  var state = loadState();

  function saveState() {
    window.localStorage.setItem(previewKey, JSON.stringify(state));
  }

  function ensureUserSession() {
    var path = window.location.pathname.replace(/\/+$/, "") || "/";
    if (path === "/" || path === "/login" || path.indexOf("/register") === 0) return;
    if (window.localStorage.getItem(userStorageKey)) return;

    window.localStorage.setItem(userStorageKey, JSON.stringify({
      accessToken: "preview-access-token",
      refreshToken: "preview-refresh-token",
      user: clone(state.currentUser)
    }));
    window.localStorage.removeItem(logoutKey);
  }

  ensureUserSession();

  function parseUrl(url) {
    return new URL(url, window.location.origin);
  }

  function isMockRequest(url) {
    var parsed = parseUrl(url);
    return parsed.href.indexOf(apiPrefix) === 0 || parsed.pathname.indexOf(apiPathPrefix) === 0;
  }

  function getPath(url) {
    return parseUrl(url).pathname.replace(/^\/backend\/api/, "") || "/";
  }

  function getQuery(url) {
    return parseUrl(url).searchParams;
  }

  function json(status, data) {
    return {
      status: status,
      statusText: status >= 400 ? "Error" : "OK",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(data)
    };
  }

  function parseBody(body) {
    if (!body) return {};
    if (typeof body === "string") {
      try {
        return JSON.parse(body);
      } catch (error) {
        return {};
      }
    }
    if (body instanceof FormData) {
      var data = {};
      body.forEach(function (value, key) { data[key] = value; });
      return data;
    }
    return body;
  }

  function currentUser() {
    return clone(state.currentUser);
  }

  function fullUserById(id) {
    var numeric = Number(id);
    return state.users.find(function (user) { return Number(user.id) === numeric; }) || null;
  }

  function retailerById(id) {
    var numeric = Number(id);
    return state.retailers.find(function (retailer) { return Number(retailer.id) === numeric; }) || null;
  }

  function filterRetailers(params) {
    var search = (params.get("search") || "").toLowerCase();
    var businessType = (params.get("businessType") || "").toLowerCase();
    var status = (params.get("status") || "").toLowerCase();
    var city = (params.get("city") || "").toLowerCase();
    var page = Math.max(1, Number(params.get("page") || 1));
    var limit = Math.max(1, Number(params.get("limit") || 10));

    var filtered = state.retailers.filter(function (retailer) {
      var matchesSearch = !search || [
        retailer.name,
        retailer.email,
        retailer.businessName,
        retailer.address.city
      ].some(function (value) { return String(value || "").toLowerCase().indexOf(search) >= 0; });
      var matchesType = !businessType || String(retailer.businessType || "").toLowerCase() === businessType;
      var matchesStatus = !status || String(retailer.status || "").toLowerCase() === status;
      var matchesCity = !city || String(retailer.address && retailer.address.city || "").toLowerCase() === city;
      return matchesSearch && matchesType && matchesStatus && matchesCity;
    });

    var total = filtered.length;
    var offset = (page - 1) * limit;
    var pageData = filtered.slice(offset, offset + limit).map(clone);

    return {
      status: "success",
      results: pageData.length,
      pagination: {
        total: total,
        page: page,
        pages: Math.max(1, Math.ceil(total / limit))
      },
      data: {
        retailers: pageData
      }
    };
  }

  function dashboardData() {
    var activeRetailers = state.retailers.filter(function (retailer) { return retailer.status === "active"; });
    var totalSales = activeRetailers.reduce(function (sum, retailer) { return sum + Number(retailer.metrics.totalSales || 0); }, 0);
    var avgSales = activeRetailers.length ? totalSales / activeRetailers.length : 0;
    var completed = state.projects.filter(function (project) { return project.status === "completed"; }).length;
    var ongoing = state.projects.filter(function (project) { return project.status === "ongoing"; }).length;
    var delayed = state.projects.filter(function (project) { return project.status === "delayed"; }).length;
    var performanceScore = Math.round(activeRetailers.reduce(function (sum, retailer) {
      return sum + Number(retailer.metrics.averageRating || 0) * 20;
    }, 0) / Math.max(activeRetailers.length, 1));

    return {
      metrics: {
        totalRetailers: { value: state.retailers.length, trend: 12 },
        activeProjects: { value: ongoing, trend: 8 },
        performanceScore: { value: performanceScore, trend: 5 },
        activeUsers: { value: activeRetailers.length, trend: 10 }
      },
      charts: {
        retailerPerformance: {
          labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
          datasets: [
            { label: "Active Retailers", data: [2, 3, 3, 4, 4, activeRetailers.length] },
            { label: "New Registrations", data: [1, 1, 0, 2, 1, 1] }
          ]
        },
        projectDistribution: {
          labels: ["Completed", "Ongoing", "Delayed"],
          data: [completed, ongoing, delayed]
        },
        revenueGrowth: {
          labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
          data: [
            Math.round(avgSales * 0.72),
            Math.round(avgSales * 0.8),
            Math.round(avgSales * 0.88),
            Math.round(avgSales * 0.93),
            Math.round(avgSales * 0.98),
            Math.round(avgSales)
          ]
        }
      }
    };
  }

  function filteredProjects(params) {
    var search = (params.get("search") || "").toLowerCase();
    var status = (params.get("status") || "").toLowerCase();

    return state.projects.filter(function (project) {
      var matchesStatus = !status || String(project.status || "").toLowerCase() === status;
      var matchesSearch = !search || [project.name, project.description].some(function (value) {
        return String(value || "").toLowerCase().indexOf(search) >= 0;
      });
      return matchesStatus && matchesSearch;
    }).map(clone);
  }

  function conversationList() {
    var me = Number(state.currentUser.id);
    var map = {};

    state.messages.forEach(function (message) {
      var otherId = Number(message.sender_id) === me ? Number(message.recipient_id) : Number(message.sender_id);
      if (!map[otherId] || new Date(message.created_at) > new Date(map[otherId].last_message_time || 0)) {
        var user = fullUserById(otherId) || {};
        map[otherId] = {
          id: otherId,
          name: user.name || "Unknown user",
          company: user.company || user.businessName || "",
          last_message: message.content,
          last_message_time: message.created_at,
          unread_count: 0
        };
      }
      if (Number(message.recipient_id) === me && !message.is_read) {
        map[otherId] = map[otherId] || {};
        map[otherId].unread_count = (map[otherId].unread_count || 0) + 1;
      }
    });

    return Object.keys(map).map(function (key) { return map[key]; }).sort(function (a, b) {
      return new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0);
    });
  }

  function conversationMessages(userId) {
    var me = Number(state.currentUser.id);
    var other = Number(userId);

    return state.messages.filter(function (message) {
      return (
        (Number(message.sender_id) === me && Number(message.recipient_id) === other) ||
        (Number(message.sender_id) === other && Number(message.recipient_id) === me)
      );
    }).sort(function (a, b) {
      return new Date(a.created_at) - new Date(b.created_at);
    }).map(clone);
  }

  function availableUsers(params) {
    var q = (params.get("q") || "").toLowerCase();
    var me = Number(state.currentUser.id);
    return state.users.filter(function (user) {
      if (Number(user.id) === me) return false;
      if (!q) return true;
      return [user.name, user.email, user.company, user.businessName].some(function (value) {
        return String(value || "").toLowerCase().indexOf(q) >= 0;
      });
    }).map(function (user) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        businessName: user.businessName || user.company || ""
      };
    });
  }

  function nextId(collection) {
    return collection.reduce(function (max, item) {
      return Math.max(max, Number(item.id) || 0);
    }, 0) + 1;
  }

  function updateStoredSession() {
    var current = window.localStorage.getItem(userStorageKey);
    if (!current) return;
    try {
      var parsed = JSON.parse(current);
      parsed.user = clone(state.currentUser);
      window.localStorage.setItem(userStorageKey, JSON.stringify(parsed));
    } catch (error) {
      window.localStorage.setItem(userStorageKey, JSON.stringify({
        accessToken: "preview-access-token",
        refreshToken: "preview-refresh-token",
        user: clone(state.currentUser)
      }));
    }
  }

  function routeRequest(method, url, body) {
    var path = getPath(url);
    var params = getQuery(url);
    var data = parseBody(body);

    if (method === "GET" && path === "/auth/profile") {
      return json(200, currentUser());
    }

    if (method === "POST" && path === "/auth/login") {
      var email = (data.email || "").toLowerCase();
      var user = state.users.find(function (entry) { return String(entry.email || "").toLowerCase() === email; }) || state.currentUser;
      state.currentUser = {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role || "staff",
        phone: user.phone || state.currentUser.phone
      };
      saveState();
      return json(200, {
        message: "Login successful",
        accessToken: "preview-access-token",
        refreshToken: "preview-refresh-token",
        user: clone(state.currentUser)
      });
    }

    if (method === "POST" && path === "/auth/register") {
      var newUserId = nextId(state.users);
      var registered = {
        id: String(newUserId),
        name: data.name || "Preview User",
        email: data.email || ("preview" + newUserId + "@bailordpulse.com"),
        role: data.type === "retailer" ? "retailer" : "staff",
        phone: data.phone || "",
        company: data.businessName || "Bailord Partner",
        businessName: data.businessName || "Bailord Partner",
        status: "active"
      };
      state.users.push(clone(registered));
      state.currentUser = {
        id: registered.id,
        name: registered.name,
        email: registered.email,
        role: registered.role,
        phone: registered.phone
      };
      saveState();
      return json(201, {
        message: "User registered successfully",
        accessToken: "preview-access-token",
        refreshToken: "preview-refresh-token",
        user: clone(state.currentUser)
      });
    }

    if ((method === "PATCH" || method === "PUT" || method === "POST") && path === "/auth/profile") {
      state.currentUser = Object.assign({}, state.currentUser, data);
      var userIndex = state.users.findIndex(function (user) { return String(user.id) === String(state.currentUser.id); });
      if (userIndex >= 0) {
        state.users[userIndex] = Object.assign({}, state.users[userIndex], state.currentUser);
      }
      saveState();
      updateStoredSession();
      return json(200, clone(state.currentUser));
    }

    if (method === "POST" && path === "/auth/change-password") {
      return json(200, { message: "Password changed successfully" });
    }

    if (method === "POST" && path === "/auth/invalidate") {
      return json(200, { message: "Tokens invalidated successfully" });
    }

    if (method === "POST" && path === "/auth/refresh") {
      return json(200, { accessToken: "preview-access-token", message: "Token refreshed successfully" });
    }

    if (method === "GET" && path === "/analytics/dashboard") {
      return json(200, dashboardData());
    }

    if (method === "GET" && path === "/retailers") {
      return json(200, filterRetailers(params));
    }

    if (method === "POST" && path === "/retailers") {
      var retailerId = nextId(state.retailers);
      var createdRetailer = {
        id: retailerId,
        name: data.name || data.contactPerson || "New Retailer",
        email: data.email || ("retailer" + retailerId + "@example.com"),
        phone: data.phone || "",
        address: data.address || { street: "", city: "Lagos", state: "Lagos", zipCode: "", country: "Nigeria" },
        businessName: data.businessName || "New Retailer Business",
        businessType: data.businessType || "General",
        registrationNumber: data.registrationNumber || ("RET-" + retailerId),
        status: data.status || "pending",
        joinedDate: dateOnly(0),
        bankDetails: data.bankDetails || { bankName: "", accountNumber: "", accountName: "" },
        metrics: data.metrics || { totalSales: 0, totalOrders: 0, averageRating: 0 },
        projects: 0,
        createdAt: iso(0),
        updatedAt: iso(0)
      };
      state.retailers.unshift(createdRetailer);
      saveState();
      return json(201, { status: "success", data: { retailer: clone(createdRetailer) } });
    }

    if (path.indexOf("/retailers/") === 0 && method === "PATCH") {
      var retailer = retailerById(path.split("/")[2]);
      if (!retailer) return json(404, { message: "Retailer not found" });
      Object.assign(retailer, data);
      retailer.updatedAt = iso(0);
      saveState();
      return json(200, { status: "success", data: { retailer: clone(retailer) } });
    }

    if (path.indexOf("/retailers/") === 0 && method === "DELETE") {
      var retailerIdToDelete = Number(path.split("/")[2]);
      state.retailers = state.retailers.filter(function (retailer) { return Number(retailer.id) !== retailerIdToDelete; });
      saveState();
      return json(200, { status: "success", data: null });
    }

    if (method === "GET" && path === "/projects") {
      return json(200, filteredProjects(params));
    }

    if (method === "POST" && path === "/projects") {
      var projectId = nextId(state.projects);
      var createdProject = {
        id: projectId,
        name: data.name || "New Project",
        description: data.description || "",
        start_date: data.startDate || dateOnly(0),
        end_date: data.endDate || dateOnly(14),
        startDate: data.startDate || dateOnly(0),
        endDate: data.endDate || dateOnly(14),
        status: "ongoing",
        progress: 0,
        assigned_retailers: 0,
        assignedRetailers: 0,
        user_id: Number(state.currentUser.id)
      };
      state.projects.unshift(createdProject);
      state.projectRetailers[String(projectId)] = [];
      saveState();
      return json(201, { message: "Project created successfully", project: clone(createdProject) });
    }

    if (path.indexOf("/projects/") === 0 && method === "PUT") {
      var projectToUpdate = state.projects.find(function (project) { return Number(project.id) === Number(path.split("/")[2]); });
      if (!projectToUpdate) return json(404, { message: "Project not found" });
      Object.assign(projectToUpdate, data);
      if (data.startDate) projectToUpdate.start_date = data.startDate;
      if (data.endDate) projectToUpdate.end_date = data.endDate;
      saveState();
      return json(200, { message: "Project updated successfully", project: clone(projectToUpdate) });
    }

    if (path.indexOf("/projects/") === 0 && method === "DELETE" && path.indexOf("/retailers/") === -1) {
      var projectIdToDelete = Number(path.split("/")[2]);
      state.projects = state.projects.filter(function (project) { return Number(project.id) !== projectIdToDelete; });
      delete state.projectRetailers[String(projectIdToDelete)];
      saveState();
      return json(200, { message: "Project deleted successfully" });
    }

    if (path.match(/^\/projects\/\d+\/retailers$/) && method === "GET") {
      var projectRetailerIds = state.projectRetailers[String(path.split("/")[2])] || [];
      var assignedRetailers = projectRetailerIds.map(function (retailerId) {
        return retailerById(retailerId) || fullUserById(retailerId);
      }).filter(Boolean).map(clone);
      return json(200, assignedRetailers);
    }

    if (path.match(/^\/projects\/\d+\/retailers$/) && method === "POST") {
      var projectIdForAssign = String(path.split("/")[2]);
      state.projectRetailers[projectIdForAssign] = clone(data.retailerIds || []);
      var targetProject = state.projects.find(function (project) { return String(project.id) === projectIdForAssign; });
      if (targetProject) {
        targetProject.assigned_retailers = state.projectRetailers[projectIdForAssign].length;
        targetProject.assignedRetailers = state.projectRetailers[projectIdForAssign].length;
      }
      saveState();
      return json(200, { message: "Retailers assigned successfully" });
    }

    if (path.match(/^\/projects\/\d+\/retailers\/\d+$/) && method === "DELETE") {
      var parts = path.split("/");
      var projectKey = String(parts[2]);
      var retailerIdForRemove = Number(parts[4]);
      state.projectRetailers[projectKey] = (state.projectRetailers[projectKey] || []).filter(function (id) {
        return Number(id) !== retailerIdForRemove;
      });
      var projectAfterRemove = state.projects.find(function (project) { return String(project.id) === projectKey; });
      if (projectAfterRemove) {
        projectAfterRemove.assigned_retailers = state.projectRetailers[projectKey].length;
        projectAfterRemove.assignedRetailers = state.projectRetailers[projectKey].length;
      }
      saveState();
      return json(200, { message: "Retailer removed from project successfully" });
    }

    if (method === "GET" && path === "/messages/conversations") {
      return json(200, conversationList());
    }

    if (path.match(/^\/messages\/conversations\/\d+$/) && method === "GET") {
      return json(200, conversationMessages(path.split("/")[3]));
    }

    if (method === "GET" && path === "/messages/available-users") {
      return json(200, availableUsers(params));
    }

    if (method === "POST" && path === "/messages/conversations") {
      var targetUserId = Number(data.userId);
      var userForConversation = fullUserById(targetUserId);
      if (!userForConversation) return json(404, { message: "User not found" });
      return json(201, {
        id: targetUserId,
        name: userForConversation.name,
        company: userForConversation.company || userForConversation.businessName || "",
        last_message: "",
        last_message_time: null,
        unread_count: 0
      });
    }

    if (method === "POST" && path === "/messages") {
      var recipientId = Number(data.recipient_id || data.recipientId);
      var newMessage = {
        id: nextId(state.messages),
        sender_id: Number(state.currentUser.id),
        recipient_id: recipientId,
        content: String(data.content || "").trim(),
        is_read: 0,
        created_at: iso(0),
        updated_at: iso(0)
      };
      state.messages.push(newMessage);
      saveState();
      return json(201, clone(newMessage));
    }

    if (path.match(/^\/messages\/\d+\/read$/) && method === "PATCH") {
      return json(200, { message: "Message marked as read" });
    }

    if (method === "GET" && path === "/search") {
      return json(200, []);
    }

    return json(404, { message: "Preview mock route not found", path: path });
  }

  function makeNativeResponse(mock) {
    return new window.Response(mock.body, {
      status: mock.status,
      statusText: mock.statusText,
      headers: mock.headers
    });
  }

  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (nativeFetch) {
    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : input.url;
      if (!isMockRequest(url)) {
        return nativeFetch(input, init);
      }
      var mock = routeRequest((init && init.method || "GET").toUpperCase(), url, init && init.body);
      return Promise.resolve(makeNativeResponse(mock));
    };
  }

  function MockXHR() {
    this.readyState = 0;
    this.status = 0;
    this.statusText = "";
    this.responseText = "";
    this.response = "";
    this.responseURL = "";
    this.onreadystatechange = null;
    this.onload = null;
    this.onerror = null;
    this.onabort = null;
    this.ontimeout = null;
    this.timeout = 0;
    this.withCredentials = false;
    this.upload = {};
    this._headers = {};
    this._listeners = {};
    this._native = null;
    this._method = "GET";
    this._url = "";
    this._async = true;
  }

  MockXHR.prototype.addEventListener = function (type, handler) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(handler);
  };

  MockXHR.prototype._emit = function (type) {
    var handlers = this._listeners[type] || [];
    handlers.forEach(function (handler) {
      try { handler.call(this); } catch (error) {}
    }, this);
  };

  MockXHR.prototype.open = function (method, url) {
    this._method = (method || "GET").toUpperCase();
    this._url = url;
    this.responseURL = parseUrl(url).href;

    if (!isMockRequest(url)) {
      this._native = new NativeXHR();
      return this._native.open.apply(this._native, arguments);
    }

    this.readyState = 1;
    if (typeof this.onreadystatechange === "function") this.onreadystatechange();
  };

  MockXHR.prototype.setRequestHeader = function (name, value) {
    if (this._native) return this._native.setRequestHeader(name, value);
    this._headers[String(name).toLowerCase()] = value;
  };

  MockXHR.prototype.getAllResponseHeaders = function () {
    if (this._native) return this._native.getAllResponseHeaders();
    return "content-type: application/json; charset=utf-8\r\n";
  };

  MockXHR.prototype.getResponseHeader = function (name) {
    if (this._native) return this._native.getResponseHeader(name);
    return String(name).toLowerCase() === "content-type" ? "application/json; charset=utf-8" : null;
  };

  MockXHR.prototype.abort = function () {
    if (this._native) return this._native.abort();
    if (typeof this.onabort === "function") this.onabort();
    this._emit("abort");
  };

  MockXHR.prototype.send = function (body) {
    var self = this;

    if (this._native) {
      this._native.onreadystatechange = function () {
        self.readyState = self._native.readyState;
        self.status = self._native.status;
        self.statusText = self._native.statusText;
        self.responseText = self._native.responseText;
        self.response = self._native.response;
        self.responseURL = self._native.responseURL;
        if (typeof self.onreadystatechange === "function") self.onreadystatechange();
      };
      this._native.onload = function () {
        self.readyState = self._native.readyState;
        self.status = self._native.status;
        self.statusText = self._native.statusText;
        self.responseText = self._native.responseText;
        self.response = self._native.response;
        if (typeof self.onload === "function") self.onload();
        self._emit("load");
      };
      this._native.onerror = function () {
        if (typeof self.onerror === "function") self.onerror();
        self._emit("error");
      };
      this._native.onabort = function () {
        if (typeof self.onabort === "function") self.onabort();
        self._emit("abort");
      };
      this._native.ontimeout = function () {
        if (typeof self.ontimeout === "function") self.ontimeout();
        self._emit("timeout");
      };
      return this._native.send(body);
    }

    var mock = routeRequest(this._method, this._url, body);
    window.setTimeout(function () {
      self.readyState = 4;
      self.status = mock.status;
      self.statusText = mock.statusText;
      self.responseText = mock.body;
      self.response = mock.body;
      if (typeof self.onreadystatechange === "function") self.onreadystatechange();
      if (typeof self.onload === "function") self.onload();
      self._emit("readystatechange");
      self._emit("load");
    }, 40);
  };

  window.XMLHttpRequest = MockXHR;
  window.__PULSE_LOCAL_PREVIEW__ = true;
})();
