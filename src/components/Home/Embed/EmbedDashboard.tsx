import React, { useCallback, useContext, useRef, useEffect } from 'react'
import { EmbedProps } from './types'
import { LookerEmbedSDK, LookerEmbedDashboard } from '@looker/embed-sdk'
import {
  ExtensionContext,
  ExtensionContextData,
  getCore40SDK
} from '@looker/extension-sdk-react'
// import { Button, Heading, Label, ToggleSwitch } from '@looker/components'
import { Popup,  
  Button,
  Icon
  } from 'semantic-ui-react'
// import { EmbedContainer } from './EmbedContainer/EmbedContainer'
// import ReactDOM from "react-dom";
// const { saveAs } = require('file-saver');
const axios = require('axios').default;

export const EmbedDashboard: React.FC<EmbedProps> = () => {
  const extensionContext = useContext<ExtensionContextData>(ExtensionContext)
  const sdk = extensionContext.core40SDK
  const [dashboardNext, setDashboardNext] = React.useState(true)
  const [running, setRunning] = React.useState(true)
  const [locationDeets,setLocationDeets] = React.useState<any>("Your approximate location will show here")
  const { extensionSDK } = extensionContext
  const [dashboard, setDashboard] = React.useState<LookerEmbedDashboard>()

  const gkey = process.env.GOOGLE_API_KEY;
  const db_id = Number(process.env.DASHBOARD_ID)
  
  const geoapi = 'https://www.googleapis.com/geolocation/v1/geolocate?key=' + gkey
  const reversegeoapi = 'https://maps.googleapis.com/maps/api/geocode/json?'

  const toggleDashboard = () => {
    setDashboardNext(!dashboardNext)
  }

  const canceller = (event: any) => {
    return { cancel: !event.modal }
  }

  const updateRunButton = (event: any) => {
    console.log(event)
    console.log(JSON.stringify(event.dashboard.dashboard_filters))
  }

  const setupDashboard = (dashboard: LookerEmbedDashboard) => {
    setDashboard(dashboard)
  }

  const geoProps = {
    considerIp: true
  }


  const embedCtrRef = useCallback(
    (el) => {
      const hostUrl = extensionContext?.extensionSDK?.lookerHostData?.hostUrl
      if (el && hostUrl) {
        el.innerHTML = ''
        LookerEmbedSDK.init(hostUrl)
        const db = LookerEmbedSDK.createDashboardWithId(db_id)
        if (dashboardNext) {
          db.withNext()
        }

        axios.post(geoapi, geoProps)
        .then(function (response:any) {
          console.log(response);

          const lat = response.data.location.lat
          const lng = response.data.location.lng
          // latlng=40.714224,-73.961452&key=' + gkey
          const lookupurl = reversegeoapi + "latlng="+String(lat)+","+String(lng)+'&key=' + gkey

          axios.get(lookupurl)
          .then(function(loc:any){

            console.log(loc)

            const startingFilters = {"Postal Code":"","Lat":lat,"Lng":lng,"Use Geo Location":"Yes","Radius Selector":"10"}

            db.withFilters(startingFilters)
            db.withTheme("")
            db.appendTo(el)
            .on('dashboard:loaded', updateRunButton)
            // .on('dashboard:run:start', updateRunButton.bind(null, true))
            .on('dashboard:run:complete', updateRunButton)
            .on('drillmenu:click', canceller)
            .on('drillmodal:explore', canceller)
            .on('dashboard:tile:explore', canceller)
            .on('dashboard:tile:view', canceller)
            .build()
            .connect()
            .then(setupDashboard)
            .catch((error: Error) => {
              console.error('Connection error', error)
            })
            setLocationDeets(loc.data.results[4]['formatted_address'])
          })
          .catch(function (error:any) {
            console.log(error);
          });

        })
        .catch(function (error:any) {
          console.log(error);
          setLocationDeets("There were issues getting your location")
        });
      }
    },
    [dashboardNext]
  )

  const runDashboard = () => {
    if (dashboard) {
      dashboard.run()
    }
  }

  return (
    <>
        <Popup content={locationDeets} trigger={<Button color='red' icon='map pin' />} />
         <div ref={embedCtrRef}>hello world</div>
    </>
  )
}