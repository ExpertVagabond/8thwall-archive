# Studio: External API Integration

This project demonstrates how to integrate an external API within Studio, showcasing how to fetch and display random quotes in an AR experience.

## Components

### random-quote-api

This component is responsible for fetching random quotes from an external API and updating the UI with the retrieved data.

#### Functionality

When the component is added to an entity:

1. Fetches a random quote from the dummyjson.com API
2. Updates the component's data with the fetched quote and author
3. Updates the UI to display the quote and author
4. Sets up event listeners for recentering the XR experience
