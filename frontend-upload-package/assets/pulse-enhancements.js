(function () {
  "use strict";

  var rafId = 0;
  var messageScrollSignature = "";

  var pageConfigs = {
    retailers: {
      heading: "Retailers",
      chip: "Relationship health",
      title: "Keep retailer partnerships active and visible.",
      copy: "Use this space to review onboarding, identify stalled follow-ups, and keep every partner relationship moving.",
      bullets: [
        "Review new and pending retailers first.",
        "Move directly from retailer health into projects.",
      ],
      actions: [
        { href: "/projects", label: "Open Projects" },
        { href: "/analytics", label: "View Analytics" }
      ]
    },
    projects: {
      heading: "Projects",
      chip: "Execution flow",
      title: "Turn project status into a daily operating rhythm.",
      copy: "Spot blocked work faster, check retailer assignments, and keep momentum visible for the whole team.",
      bullets: [
        "Review active work before opening new items.",
        "Use messages to follow up on at-risk delivery points.",
      ],
      actions: [
        { href: "/retailers", label: "Review Retailers" },
        { href: "/messages", label: "Open Messages" }
      ]
    },
    messages: {
      heading: "Messages",
      chip: "Outreach",
      title: "Make conversations easier to start, track, and close.",
      copy: "Keep retailer outreach close to the rest of your operations so updates, reminders, and escalations do not get lost.",
      bullets: [
        "Check unread threads before switching contexts.",
        "Use analytics after campaign or project follow-up.",
      ],
      actions: [
        { href: "/retailers", label: "Open Retailers" },
        { href: "/analytics", label: "Check Analytics" }
      ]
    },
    analytics: {
      heading: "Analytics & Reports",
      chip: "Decision support",
      title: "Read performance trends without losing the operational context.",
      copy: "Use analytics to confirm what needs attention, then jump straight back into the teams, retailers, and projects behind the numbers.",
      bullets: [
        "Compare performance with current project load.",
        "Turn dips into outreach and action quickly.",
      ],
      actions: [
        { href: "/dashboard", label: "Back to Dashboard" },
        { href: "/messages", label: "Follow Up in Messages" }
      ]
    },
    settings: {
      heading: "Settings",
      chip: "Workspace setup",
      title: "Make the workspace feel owned by your team.",
      copy: "Profile, security, notifications, and preferences all work better when they are clear, intentional, and easy to revisit.",
      bullets: [
        "Update profile details that improve team visibility.",
        "Review security and notification defaults regularly.",
      ],
      actions: [
        { href: "/dashboard", label: "Return to Dashboard" },
        { href: "/messages", label: "Open Messages" }
      ]
    }
  };

  function normalizePath(pathname) {
    var value = pathname.replace(/\/+$/, "");
    return value || "/";
  }

  function currentRoute() {
    var path = normalizePath(window.location.pathname);

    if (path === "/" || path === "/login") return "login";
    if (path.indexOf("/register") === 0) return "register";
    if (path.indexOf("/dashboard") === 0) return "dashboard";
    if (path.indexOf("/retailers") === 0) return "retailers";
    if (path.indexOf("/projects") === 0) return "projects";
    if (path.indexOf("/messages") === 0) return "messages";
    if (path.indexOf("/analytics") === 0) return "analytics";
    if (path.indexOf("/settings") === 0) return "settings";

    return "app";
  }

  function getUser() {
    try {
      var raw = window.localStorage.getItem("bailord_user");
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && (parsed.user || parsed);
    } catch (error) {
      return null;
    }
  }

  function firstName(name) {
    if (!name) return "there";
    return String(name).trim().split(/\s+/)[0] || "there";
  }

  function setRouteState(route) {
    document.documentElement.dataset.pulseRoute = route;
    if (document.body) {
      document.body.dataset.pulseRoute = route;
    }
  }

  function removeIfPresent(selector, predicate) {
    document.querySelectorAll(selector).forEach(function (node) {
      if (!predicate || predicate(node)) {
        node.remove();
      }
    });
  }

  function toArray(list) {
    return Array.prototype.slice.call(list || []);
  }

  function classNameText(node) {
    return node && typeof node.className === "string" ? node.className : "";
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function findAncestorByClassFragment(node, fragment) {
    var current = node;
    while (current && current !== document.body) {
      if (classNameText(current).indexOf(fragment) >= 0) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  function findButtonByText(text, scope) {
    return Array.prototype.find.call((scope || document).querySelectorAll("button"), function (node) {
      return normalizeText(node.textContent) === text;
    });
  }

  function resolvePageAnchor(heading) {
    var anchor = heading && heading.parentElement;
    if (!anchor) return null;

    var parent = anchor.parentElement;
    if (parent && classNameText(parent).indexOf("justify-between") >= 0) {
      return parent;
    }

    return anchor;
  }

  function findHeading(text) {
    var headings = document.querySelectorAll("h1");
    for (var i = 0; i < headings.length; i += 1) {
      if ((headings[i].textContent || "").trim() === text) {
        return headings[i];
      }
    }
    return null;
  }

  function findAuthContainer() {
    return document.querySelector("#root > div.min-h-screen");
  }

  function findAuthCard(container) {
    if (!container) return null;
    for (var i = 0; i < container.children.length; i += 1) {
      var child = container.children[i];
      if (child && child.querySelector && child.querySelector("form")) {
        return child;
      }
    }
    return null;
  }

  function authMarkup(route) {
    if (route === "register") {
      return [
        '<div class="pulse-auth-badge">Bailord Limited</div>',
        '<h2 class="pulse-auth-title">Join a calmer, more accountable operations flow.</h2>',
        '<p class="pulse-auth-copy">Register once and keep retailer onboarding, project visibility, and follow-up communication inside the same workspace.</p>',
        '<div class="pulse-auth-grid">',
        '<div class="pulse-auth-stat"><span class="pulse-auth-value">1</span><span class="pulse-auth-label">Shared workspace</span></div>',
        '<div class="pulse-auth-stat"><span class="pulse-auth-value">3</span><span class="pulse-auth-label">Core workflows</span></div>',
        '<div class="pulse-auth-stat"><span class="pulse-auth-value">24/7</span><span class="pulse-auth-label">Access on demand</span></div>',
        "</div>",
        '<ul class="pulse-auth-list">',
        "<li>Bring retailer records, messaging, and project follow-up together.</li>",
        "<li>Reduce handoff confusion with clearer visibility for every team member.</li>",
        "<li>Start with a cleaner workspace that feels like Bailord from the first screen.</li>",
        "</ul>",
        '<div class="pulse-auth-note">Create your account, then move directly into the retailer, project, and analytics views that matter most.</div>'
      ].join("");
    }

    return [
      '<div class="pulse-auth-badge">Bailord Limited</div>',
      '<h2 class="pulse-auth-title">Retailer operations, without the scramble.</h2>',
      '<p class="pulse-auth-copy">Bailord Pulse gives your team one place to review partner activity, track work, and respond to the conversations that move business forward.</p>',
      '<div class="pulse-auth-grid">',
      '<div class="pulse-auth-stat"><span class="pulse-auth-value">Retailers</span><span class="pulse-auth-label">Visible health and follow-up</span></div>',
      '<div class="pulse-auth-stat"><span class="pulse-auth-value">Projects</span><span class="pulse-auth-label">Aligned delivery progress</span></div>',
      '<div class="pulse-auth-stat"><span class="pulse-auth-value">Analytics</span><span class="pulse-auth-label">Signals that support decisions</span></div>',
      "</div>",
      '<ul class="pulse-auth-list">',
      "<li>Start the day with a clearer picture of what needs action.</li>",
      "<li>Keep communication close to execution instead of scattered across tools.</li>",
      "<li>Give the workspace a stronger first impression for staff and partners.</li>",
      "</ul>",
      '<div class="pulse-auth-note">Sign in to review what needs attention today, then jump straight into retailers, projects, messages, or analytics.</div>'
    ].join("");
  }

  function enhanceAuth(route) {
    var isAuth = route === "login" || route === "register";
    var container = findAuthContainer();

    if (!isAuth || !container) {
      removeIfPresent(".pulse-auth-panel");
      removeIfPresent(".pulse-auth-layout", function () { return false; });
      var authContainer = document.querySelector(".pulse-auth-layout");
      if (authContainer) authContainer.classList.remove("pulse-auth-layout");
      var authCard = document.querySelector(".pulse-auth-card");
      if (authCard) authCard.classList.remove("pulse-auth-card");
      return;
    }

    var card = findAuthCard(container);
    if (!card) return;

    container.classList.add("pulse-auth-layout");
    card.classList.add("pulse-auth-card");

    var panel = container.querySelector(".pulse-auth-panel");
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "pulse-auth-panel";
      container.insertBefore(panel, card);
    }

    panel.innerHTML = authMarkup(route);
  }

  function actionLinks(actions, primaryClass) {
    return actions.map(function (action, index) {
      var className = index === 0 ? "pulse-button" : "pulse-button-secondary";
      if (primaryClass) className = primaryClass(index);
      return '<a class="' + className + '" href="' + action.href + '">' + action.label + "</a>";
    }).join("");
  }

  function ensureDashboardHero() {
    var heading = findHeading("Dashboard");
    if (!heading) return;

    var anchor = resolvePageAnchor(heading);
    if (!anchor) return;

    var user = getUser();
    var greeting = "Hello, " + firstName(user && user.name) + ".";
    var existing = document.querySelector('.pulse-hero-banner[data-route="dashboard"]');
    if (!existing) {
      existing = document.createElement("section");
      existing.className = "pulse-hero-banner";
      existing.dataset.route = "dashboard";
      anchor.insertAdjacentElement("afterend", existing);
    }

    existing.innerHTML = [
      '<div class="pulse-hero-grid">',
      '<article class="pulse-hero-card">',
      '<div class="pulse-chip">Today</div>',
      '<h2 class="pulse-hero-title">' + greeting + " Keep Bailord Pulse focused on action.</h2>",
      '<p class="pulse-hero-copy">Review retailer health, respond to open conversations, and move work forward without bouncing between disconnected admin screens.</p>',
      '<div class="pulse-actions">',
      actionLinks([
        { href: "/messages", label: "Open Messages" },
        { href: "/projects", label: "Review Projects" },
        { href: "/analytics", label: "Check Analytics" }
      ]),
      "</div>",
      "</article>",
      '<article class="pulse-hero-card">',
      '<div class="pulse-chip">Focus</div>',
      '<h3 class="pulse-hero-title">Prioritize the conversations that unblock work.</h3>',
      '<p class="pulse-hero-copy">Move from dashboard insight into project and retailer follow-up quickly.</p>',
      "</article>",
      '<article class="pulse-hero-card">',
      '<div class="pulse-chip">Rhythm</div>',
      '<h3 class="pulse-hero-title">Keep the workspace useful every day.</h3>',
      '<p class="pulse-hero-copy">Use quick actions and visible summaries to make the next step obvious.</p>',
      "</article>",
      "</div>"
    ].join("");
  }

  function ensurePageStrip(route, config) {
    var heading = findHeading(config.heading);
    if (!heading) return;

    var anchor = resolvePageAnchor(heading);
    if (!anchor) return;

    var existing = document.querySelector('.pulse-page-strip[data-route="' + route + '"]');
    if (!existing) {
      existing = document.createElement("section");
      existing.className = "pulse-page-strip";
      existing.dataset.route = route;
      anchor.insertAdjacentElement("afterend", existing);
    }

    existing.innerHTML = [
      '<div class="pulse-page-copy-wrap">',
      '<div class="pulse-chip">' + config.chip + "</div>",
      '<h2 class="pulse-page-title">' + config.title + "</h2>",
      '<p class="pulse-page-copy">' + config.copy + "</p>",
      '<ul class="pulse-page-list">',
      config.bullets.map(function (bullet) { return "<li>" + bullet + "</li>"; }).join(""),
      "</ul>",
      "</div>",
      '<div class="pulse-actions">' + actionLinks(config.actions) + "</div>"
    ].join("");
  }

  function ensureMessagesEmptyTip() {
    var emptyTitle = Array.prototype.find.call(document.querySelectorAll("p"), function (node) {
      return (node.textContent || "").trim() === "No messages yet";
    });

    if (!emptyTitle || !emptyTitle.parentElement) {
      removeIfPresent('.pulse-empty-tip[data-route="messages"]');
      return;
    }

    var existing = document.querySelector('.pulse-empty-tip[data-route="messages"]');
    if (!existing) {
      existing = document.createElement("section");
      existing.className = "pulse-empty-tip";
      existing.dataset.route = "messages";
      emptyTitle.parentElement.insertAdjacentElement("afterend", existing);
    }

    existing.innerHTML = [
      '<div class="pulse-chip">Conversation starter</div>',
      '<h3 class="pulse-empty-title">Use messages as an operating tool, not just an inbox.</h3>',
      '<p class="pulse-empty-copy">Start with project follow-up, onboarding reminders, or retailer check-ins that connect directly to active work.</p>',
      '<ul class="pulse-empty-list">',
      "<li>Follow up with retailers that need approval or guidance.</li>",
      "<li>Use analytics and project context before reaching out.</li>",
      "</ul>",
      '<div class="pulse-actions">',
      actionLinks([
        { href: "/retailers", label: "Open Retailers" },
        { href: "/projects", label: "Open Projects" }
      ]),
      "</div>"
    ].join("");
  }

  function ensureMessagesSummary(shell, grid, conversationPanel, threadPanel) {
    if (!shell || !grid) {
      removeIfPresent(".pulse-messages-summary");
      return;
    }

    var existing = shell.querySelector(".pulse-messages-summary");
    if (!existing) {
      existing = document.createElement("section");
      existing.className = "pulse-messages-summary";
      grid.insertAdjacentElement("beforebegin", existing);
    }

    var conversationItems = conversationPanel ? toArray(conversationPanel.querySelectorAll(".pulse-conversation-item")) : [];
    var unreadTotal = conversationItems.reduce(function (total, item) {
      var badge = item.querySelector(".pulse-conversation-badge");
      return total + Number(normalizeText(badge && badge.textContent) || 0);
    }, 0);
    var activeConversation = Array.prototype.find.call(conversationItems, function (item) {
      return item.dataset.active === "true";
    });
    var selectedNameNode = activeConversation && activeConversation.querySelector("p.font-medium");
    var threadHeaderName = threadPanel && threadPanel.querySelector(".pulse-thread-header p.font-medium");
    var selectedName = normalizeText((threadHeaderName || selectedNameNode) && (threadHeaderName || selectedNameNode).textContent) || "Choose a conversation";
    var draftInput = threadPanel && threadPanel.querySelector(".pulse-composer-input");
    var hasDraft = !!normalizeText(draftInput && draftInput.value);

    existing.innerHTML = [
      '<article class="pulse-messages-stat">',
      '<div class="pulse-messages-stat-label">Inbox</div>',
      '<div class="pulse-messages-stat-value">' + conversationItems.length + "</div>",
      '<p class="pulse-messages-stat-copy">Active conversation threads in your working view.</p>',
      "</article>",
      '<article class="pulse-messages-stat">',
      '<div class="pulse-messages-stat-label">Unread</div>',
      '<div class="pulse-messages-stat-value">' + unreadTotal + "</div>",
      '<p class="pulse-messages-stat-copy">Messages waiting for a reply or quick follow-up.</p>',
      "</article>",
      '<article class="pulse-messages-stat">',
      '<div class="pulse-messages-stat-label">Focus</div>',
      '<div class="pulse-messages-stat-value">' + selectedName + "</div>",
      '<p class="pulse-messages-stat-copy">' + (hasDraft ? "Draft in progress. Keep the reply moving." : "Open a thread and keep the next action obvious.") + "</p>",
      "</article>"
    ].join("");
  }

  function ensureMessagesLayout() {
    var heading = findHeading("Messages");
    if (!heading) {
      removeIfPresent(".pulse-messages-summary");
      messageScrollSignature = "";
      return;
    }

    var shell = findAncestorByClassFragment(heading, "space-y-6");
    if (!shell) return;

    shell.classList.add("pulse-messages-shell");

    var grid = Array.prototype.find.call(shell.querySelectorAll("div"), function (node) {
      var classes = classNameText(node);
      return classes.indexOf("grid-cols-12") >= 0 && classes.indexOf("h-[calc(100vh-16rem)]") >= 0;
    });

    if (!grid) {
      removeIfPresent(".pulse-messages-summary");
      messageScrollSignature = "";
      return;
    }

    grid.classList.add("pulse-messages-grid");

    var panels = toArray(grid.children).filter(function (node) {
      return node && node.nodeType === 1;
    });
    var conversationPanel = panels[0] || null;
    var threadPanel = panels[1] || null;

    if (conversationPanel) {
      conversationPanel.classList.add("pulse-conversation-panel");
    }

    if (threadPanel) {
      threadPanel.classList.add("pulse-thread-panel");
    }

    var newMessageButton = findButtonByText("New Message", shell);
    if (newMessageButton) {
      newMessageButton.classList.add("pulse-messages-cta");
    }

    if (conversationPanel) {
      var searchInput = Array.prototype.find.call(conversationPanel.querySelectorAll("input"), function (node) {
        return normalizeText(node.getAttribute("placeholder")).toLowerCase() === "search conversations...";
      });

      if (searchInput) {
        searchInput.classList.add("pulse-conversation-search-input");
        var searchWrap = findAncestorByClassFragment(searchInput, "p-4");
        if (searchWrap && conversationPanel.contains(searchWrap)) {
          searchWrap.classList.add("pulse-conversation-search");
        }
      }

      var conversationButtons = toArray(conversationPanel.querySelectorAll("button")).filter(function (node) {
        return normalizeText(node.textContent) !== "New Message";
      });

      conversationButtons.forEach(function (button) {
        button.classList.add("pulse-conversation-item");
        button.dataset.active = classNameText(button).indexOf("bg-primary/10") >= 0 ? "true" : "false";

        var metaLine = Array.prototype.find.call(button.querySelectorAll("p"), function (node) {
          return classNameText(node).indexOf("text-xs") >= 0 && classNameText(node).indexOf("mb-1") >= 0;
        });
        if (metaLine) {
          metaLine.classList.add("pulse-conversation-meta");
        }

        var previewLine = Array.prototype.find.call(button.querySelectorAll("p"), function (node) {
          return classNameText(node).indexOf("text-sm") >= 0 && classNameText(node).indexOf("truncate") >= 0;
        });
        if (previewLine) {
          previewLine.classList.add("pulse-conversation-preview");
        }

        var badge = Array.prototype.find.call(button.querySelectorAll("span"), function (node) {
          return /^\d+$/.test(normalizeText(node.textContent));
        });
        if (badge) {
          badge.classList.add("pulse-conversation-badge");
        }
      });

      var conversationList = conversationButtons.length ? findAncestorByClassFragment(conversationButtons[0], "p-2") : null;
      if (conversationList) {
        conversationList.classList.add("pulse-conversation-list");
      }
    }

    if (threadPanel) {
      var header = toArray(threadPanel.children).find(function (node) {
        return classNameText(node).indexOf("border-b") >= 0;
      });
      if (header) {
        header.classList.add("pulse-thread-header");
      }

      var composer = threadPanel.querySelector("form");
      if (composer) {
        composer.classList.add("pulse-composer");

        var composerInput = Array.prototype.find.call(composer.querySelectorAll("input"), function (node) {
          return String(node.type || "").toLowerCase() === "text";
        });
        if (composerInput) {
          composerInput.classList.add("pulse-composer-input");
        }

        var sendButton = composer.querySelector('button[type="submit"]');
        if (sendButton) {
          sendButton.classList.add("pulse-composer-send");
        }
      }

      var threadBody = composer ? composer.previousElementSibling : null;
      if (threadBody) {
        threadBody.classList.add("pulse-thread-body");

        var placeholderText = Array.prototype.find.call(threadBody.querySelectorAll("p"), function (node) {
          var text = normalizeText(node.textContent);
          return text === "No messages yet" || text === "Select a conversation to start messaging" || text === "Loading conversation...";
        });
        if (placeholderText) {
          var placeholderWrap = findAncestorByClassFragment(placeholderText, "items-center");
          if (placeholderWrap && threadBody.contains(placeholderWrap)) {
            placeholderWrap.classList.add("pulse-thread-placeholder");
          }
        }

        var messageList = Array.prototype.find.call(threadBody.querySelectorAll("div"), function (node) {
          return classNameText(node).indexOf("space-y-4") >= 0 && !!node.querySelector("p.text-sm.whitespace-pre-wrap");
        });

        if (messageList) {
          messageList.classList.add("pulse-message-list");

          var messageRows = toArray(messageList.children).filter(function (node) {
            return node && node.nodeType === 1;
          });

          messageRows.forEach(function (row) {
            var direction = classNameText(row).indexOf("justify-end") >= 0 ? "outgoing" : "incoming";
            row.classList.add("pulse-message-row");
            row.dataset.direction = direction;

            var bubble = Array.prototype.find.call(row.querySelectorAll("div"), function (node) {
              var classes = classNameText(node);
              return classes.indexOf("max-w-[70%]") >= 0 && classes.indexOf("rounded-lg") >= 0 && classes.indexOf("p-3") >= 0;
            });

            if (bubble) {
              bubble.classList.add("pulse-message-bubble");
              bubble.dataset.direction = direction;
            }
          });

          var headerName = header && header.querySelector("p.font-medium");
          var lastRow = messageRows[messageRows.length - 1];
          var nextSignature = [
            normalizeText(headerName && headerName.textContent),
            messageRows.length,
            normalizeText(lastRow && lastRow.textContent)
          ].join("|");

          if (nextSignature && nextSignature !== messageScrollSignature) {
            messageScrollSignature = nextSignature;
            var scrollViewport = threadBody.querySelector("[data-radix-scroll-area-viewport]") || threadBody;
            window.requestAnimationFrame(function () {
              scrollViewport.scrollTop = scrollViewport.scrollHeight;
            });
          }
        } else {
          messageScrollSignature = "";
        }
      }
    }

    ensureMessagesSummary(shell, grid, conversationPanel, threadPanel);
  }

  function cleanupForRoute(route) {
    removeIfPresent(".pulse-hero-banner", function (node) {
      return node.dataset.route !== route;
    });

    removeIfPresent(".pulse-page-strip", function (node) {
      return node.dataset.route !== route;
    });

    if (route !== "messages") {
      removeIfPresent('.pulse-empty-tip[data-route="messages"]');
      removeIfPresent(".pulse-messages-summary");
      messageScrollSignature = "";
    }
  }

  function applyEnhancements() {
    rafId = 0;

    var route = currentRoute();
    setRouteState(route);
    cleanupForRoute(route);
    enhanceAuth(route);

    if (route === "dashboard") {
      ensureDashboardHero();
    }

    if (pageConfigs[route]) {
      ensurePageStrip(route, pageConfigs[route]);
    }

    if (route === "messages") {
      ensureMessagesEmptyTip();
      ensureMessagesLayout();
    }
  }

  function scheduleEnhancements() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(applyEnhancements);
  }

  function patchHistoryMethod(method) {
    var original = history[method];
    history[method] = function () {
      var result = original.apply(this, arguments);
      window.dispatchEvent(new Event("locationchange"));
      scheduleEnhancements();
      return result;
    };
  }

  patchHistoryMethod("pushState");
  patchHistoryMethod("replaceState");

  window.addEventListener("popstate", scheduleEnhancements);
  window.addEventListener("locationchange", scheduleEnhancements);
  window.addEventListener("load", scheduleEnhancements);
  document.addEventListener("DOMContentLoaded", scheduleEnhancements);

  var root = document.getElementById("root");
  if (root && "MutationObserver" in window) {
    new MutationObserver(scheduleEnhancements).observe(root, {
      childList: true,
      subtree: true
    });
  }

  scheduleEnhancements();
})();
