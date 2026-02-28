This project template demonstrates how to implement Access Pass. Showcases how to prompt users to purchase the access pass, how to handle new and returning payments. 

### Using Access Pass
Access pass allows you to add a one time payment to your product that expires after a minimum of 1 day to a maximum of 7 days. No user login necessary. Access pass is available on one device and is removed when browser cache is cleared.

In order to use Access Pass you must sign up for our Payments API on your Accounts page.

Access passes are well suited to enable paid access to AR/VR events such as a 1-day ticket to a holographic concert or a virtual art exhibit or 7-day access to an AR-enabled scavenger hunt.

In the end user experience, the user will:

1. View the Access Pass Prompt or the prompt to purchase the product 
2. Click CTA will open up checkout flow hosted on 8thwall.com 
3. Allows users to purchase a product for a specific price 
4. Save the purchase on local device storage until the preconfigured time period


---

### Project Overview

The **payments** module ([documentation](https://www.8thwall.com/docs/web/#monetize-with-8th-wall-payments)) is imported in this project.
This contains the API that provides a secure way for end users to pay for your experience.

The **access-pass** directory contains all the logic for displaying a full-screen "Access Pass" page prior to the 8th Wall experience.
This leverages the [Payments Module](https://www.8thwall.com/docs/web/#monetize-with-8th-wall-payments).

- In **access-pass/access-pass-modal.html**, we define the HTML for the full-screen "Acccess Pass" page that end users will see before the experience.
- In **access-pass/access-pass-modal.js**, we define the logic to render the "Access Pass" page. This leverages the [AccessPass.requestPurchaseIfNeeded](https://www.8thwall.com/docs/web/#accesspassrequestpurchaseifneeded) API to request an access pass purchase.
- In **access-pass/accesspass-modal.scss**, we define the styles for the "Access Pass" page.
- In **access-pass/pipeline-module.js**, we define a [CameraPipelineModule](https://www.8thwall.com/docs/web/#camerapipelinemodule) which will leverages `access-pass-modal.js` to display the "Access Pass" page before the 8th Wall experience runs.
- In **access-pass/aframe-component.js**, we create an A-Frame component which wraps the [CameraPipelineModule](https://www.8thwall.com/docs/web/#camerapipelinemodule) created in **pipeline-module.js**. This will allow us to easily add the "Access Pass" page to our A-Frame scene.

In **body.html**, we add the ```access-pass``` attribute to our ```<a-scene>```.

---

## About the HoloStream Experience

HoloStream is an adaptive bitrate volumetric video streaming solution.

Credits:

Stellar circulation (short version)  
Dancer / Choreographer:　Fumiaki Kudo  
Dancer:　Asako Tanaka  
Music:　Jin Takemoto  
Costume design:　Haruko Takeda  
Capture Studio: Crescent  
Editing / Streaming: HoloSuite  

Interested in adding adaptive bitrate volumetric video streaming to your project? Reach out to [Arcturus](https://arcturus.studio/) directly to get started using HoloStream.
