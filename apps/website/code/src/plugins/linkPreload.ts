import { ReactRouterOnLinkPlugin } from "@webiny/react-router/types";
import gql from "graphql-tag";
import { GET_PUBLISHED_PAGE } from "../components/Page/graphql";

declare global {
    interface Window {
        __PS_RENDER_ID__: string;
    }
}

export default (): ReactRouterOnLinkPlugin => {
    const preloadedPaths = [];

    return {
        name: "react-router-on-link-pb",
        type: "react-router-on-link",
        async onLink({ link: path, apolloClient }) {
            if (process.env.REACT_APP_ENV !== "browser") {
                return;
            }

            if (
                typeof path !== "string" ||
                !path.startsWith("/") ||
                preloadedPaths.includes(path)
            ) {
                return;
            }

            preloadedPaths.push(path);

            let graphqlJson = "graphql.json";
            if (window.__PS_RENDER_ID__) {
                graphqlJson += `?k=${window.__PS_RENDER_ID__}`;
            }

            const fetchPath = path !== "/" ? `${path}/${graphqlJson}` : `/${graphqlJson}`;
            const pageState = await fetch(fetchPath)
                .then(res => res.json())
                .catch(() => null);

            if (pageState) {
                for (let i = 0; i < pageState.length; i++) {
                    const { query, variables, data } = pageState[i];
                    apolloClient.writeQuery({
                        query: gql`
                            ${query}
                        `,
                        data,
                        variables
                    });
                }
            } else {
                apolloClient.query({
                    query: GET_PUBLISHED_PAGE(),
                    variables: {
                        id: null,
                        path,
                        preview: false,
                        returnErrorPage: true,
                        returnNotFoundPage: true
                    }
                });
            }
        }
    };
};
