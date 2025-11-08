(() => {
        const searchParameters = new URLSearchParams(window.location.search);
        if (searchParameters.has("redirect")) {
                const redirectPath = searchParameters.get("redirect");
                history.replaceState({}, "", redirectPath);
        }

        const deepFreeze = object => {
                if (object === undefined) {
                        return object;
                }

                Object.freeze(object);

                for (const property of Object.getOwnPropertyNames(object)) {
                        const value = object[property];

                        if (value === undefined) {
                                return;
                        }

                        const type = typeof value;
                        if (type === "object" || type === "function") {
                                if (!Object.isFrozen(value)) {
                                        deepFreeze(value);
                                }
                        }
                }

                return object;
        };

        const routes = deepFreeze({
                "/home": {
                        html: "Home.html",
                },
                "/sokobee": {
                        html: "Sokobee.html",
                        scripts: [
                                "Sokobee.js"
                        ]
                }
        });

        const content = document.getElementById("content");
        const fallbackPage = () => {
                // This could be an error while loading the page, or the page being not found (404)
                // Maybe add more information for the type of error and/or use <template>s in <main>
                content.innerHTML = "<h1>Error loading page</h1>";
        };

        const updatePage = async path => {
                const route = routes[path];
                if (route === undefined) {
                        fallbackPage();
                        return;
                }

                try {
                        const response = await fetch(route.html);
                        if (!response.ok) {
                                console.error(`Failed to load page ${url}: ${response.status} ${response.statusText}`);
                                fallbackPage();
                                return;
                        }

                        content.innerHTML = await response.text();

                        for (const script of route.scripts ?? []) {
                                const element = document.createElement("script");
                                element.src = script;
                                content.appendChild(element);
                        }
                } catch (error) {
                        console.error(`Navigation error: ${error}`);
                        fallbackPage();
                        return;
                }
        };

        document.querySelectorAll("a.navigation-link").forEach(link => {
                link.addEventListener("click", event => {
                        event.preventDefault();

                        const path = link.getAttribute("href");
                        history.pushState({}, "", path);
                        updatePage(path);
                });
        });

        window.addEventListener("popstate", () => {
                updatePage(window.location.pathname);
        });

        if (window.location.pathname === "/") {
                history.replaceState({}, "", "/home");
        }

        updatePage(window.location.pathname);
})();