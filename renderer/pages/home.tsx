import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  Button,
  Drawer,
  Grid,
  IconButton,
  Sheet,
  Typography,
} from "@mui/joy";
import axios from "axios";
import Cookies from "js-cookie";
import MenuIcon from "@mui/icons-material/Menu";
import FolderIcon from "@mui/icons-material/Folder";

export function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  function closeDrawer() {
    setDrawerOpen(false);
  }
  function openDrawer() {
    setDrawerOpen(true);
  }
  return (
    <Box>
      <Sheet sx={{ display: "flex", alignItems: "center", px: 2, py: 1 }}>
        <Typography sx={{ flex: 1 }}>Caption Me</Typography>
        <IconButton sx={{ mr: -1 }} onClick={openDrawer}>
          <MenuIcon />
        </IconButton>
      </Sheet>
      {children}
      <Drawer open={drawerOpen} onClose={closeDrawer} />
    </Box>
  );
}

export default function HomePage() {
  const [message, setMessage] = React.useState("No message found");
  const [images, setImages] = useState([]);

  React.useEffect(() => {
    window.ipc.on("message", (message: string) => {
      setMessage(message);
    });
  }, []);

  return (
    <Layout>
      <Head>
        <title>Blibla Electron App</title>
      </Head>
      <div>
        <p>
          ⚡ Electron + Next.js ⚡ -<Link href="/next">Go to next page</Link>
        </p>
        <Image
          src="/images/logo.png"
          alt="Logo image"
          width={256}
          height={256}
        />
      </div>
      <div>
        <Button
          onClick={async () => {
            try {
              const directory = await window.ipc.selectFolder();
              if (directory) {
                const { data } = await axios.post(`/api/blip/`, {
                  directory,
                });
                console.log(data);
              }
            } catch (error) {
              console.log(error);
            }
          }}
        >
          Test BLIP
        </Button>
        <Button
          onClick={() => {
            window.ipc.send("message", "Hello");
          }}
        >
          Test IPC
        </Button>
        <IconButton
          onClick={async () => {
            try {
              const directory = await window.ipc.selectFolder();
              if (directory) {
                const { data } = await axios.post(`/api/images/`, {
                  directory,
                });
                console.log(data);
                Cookies.set("selectedDirectory", data.directory, {
                  expires: 7,
                });
                setImages(data.images);
              }
            } catch (error) {
              console.log(error);
            }
          }}
        >
          <FolderIcon />
        </IconButton>
        <p>{message}</p>
      </div>
      <Grid container spacing={2} columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}>
        {images.map((image) => {
          return (
            <Grid xs={1} key={image.id}>
              <Image
                src={image.publicPath}
                alt=""
                height={image.height}
                width={image.width}
                style={{ width: "100%", height: "auto" }}
              />
            </Grid>
          );
        })}
      </Grid>
    </Layout>
  );
}
