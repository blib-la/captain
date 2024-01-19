import React, { useEffect, useState } from "react";
import Head from "next/head";

import Image from "next/image";
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Drawer,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  Input,
  Sheet,
  styled,
  Typography,
} from "@mui/joy";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MenuIcon from "@mui/icons-material/Menu";
import FolderIcon from "@mui/icons-material/Folder";
import SaveIcon from "@mui/icons-material/Save";
import dynamic from "next/dynamic";

const CodeMirror = dynamic(
  () => import("react-codemirror2").then((module_) => module_.Controlled),
  { ssr: false },
);
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

const defaultSystemMessage = `1. You receive an array of images
2. Please look at the images and analyze them with high precision, detect the details
3. Create an array of strings (a caption for each image)
4. Submit a valid JSON code-block
`;

const defaultExampleResponse = `[
  "a young woman, looking at viewer, close-up view, cheerful expression, blonde long hair, stud earrings, light from one side, shade on face, green turtleneck",
  "a mid-aged man, chubby body, looking to the side, upper body view, blue torn wide denim dungarees, red dirty fedora, white stained t-shirt, holding a rake in one hand and a book in the other, sunshine on  a summer  day"
]
`;

const StyledEditor = styled(CodeMirror)({
  height: "100%",
  ">.CodeMirror": {
    height: "100%",
  },
});

export default function HomePage() {
  const [images, setImages] = useState([]);
  const [directory, setDirectory] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);
  const [systemMessage, setSystemMessage] = useState(defaultSystemMessage);
  const [exampleResponse, setExampleResponse] = useState(
    defaultExampleResponse,
  );

  useEffect(() => {
    // Request the API key
    window.ipc.send("get-apiKey");

    // Listener for the apiKey response
    window.ipc.on("apiKey", (key) => {
      if (key) {
        setApiKey(key as string);
      }
    });
  }, []);

  useEffect(() => {
    // Request the API key
    window.ipc.send("get-directory");

    // Listener for the apiKey response
    window.ipc.on("directory", (directory_) => {
      if (directory_) {
        setDirectory(directory_ as string);
        window.ipc.showContent(directory_).then((content) => {
          console.log(content);
          setImages(content);
        });
      }
    });
  }, []);

  return (
    <Layout>
      <Head>
        <title>Captain</title>
      </Head>
      <form>
        <Typography level="title-lg" my={2}>
          Guidelines
        </Typography>
        <Box sx={{ height: 300 }}>
          <StyledEditor
            value={systemMessage}
            options={{
              mode: "markdown",
              theme: "material",
              lineWrapping: true,
            }}
            onBeforeChange={(editor, data, value) => {
              setSystemMessage(value);
            }}
          />
        </Box>
        <Typography level="title-lg" my={2}>
          Example Response
        </Typography>
        <Box sx={{ height: 300 }}>
          <StyledEditor
            value={exampleResponse}
            options={{
              mode: "application/ld+json",
              theme: "material-darker",
              lineWrapping: true,
            }}
            onBeforeChange={(editor, data, value) => {
              setExampleResponse(value);
            }}
          />
        </Box>

        <FormControl sx={{ my: 2 }}>
          <FormLabel>OpenAI API Key</FormLabel>
          <Input
            value={apiKey}
            type={keyVisible ? "text" : "password"}
            startDecorator={
              <IconButton
                onClick={async () => {
                  setKeyVisible(!keyVisible);
                }}
              >
                {keyVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            }
            endDecorator={
              <IconButton
                color="primary"
                variant="soft"
                onClick={async () => {
                  await window.ipc.store({
                    property: "openaiApiKey",
                    value: apiKey,
                  });
                }}
              >
                <SaveIcon />
              </IconButton>
            }
            onChange={(event) => {
              setApiKey(event.target.value);
            }}
          />
        </FormControl>
      </form>

      <ButtonGroup variant={"solid"}>
        <Button
          disabled={!directory}
          startDecorator={loading ? <CircularProgress /> : <FolderIcon />}
          onClick={async () => {
            setLoading(true);
            try {
              if (directory) {
                const content = await window.ipc.handleRunBlip(directory);
                console.log(content);
                const images_ = await window.ipc.showContent(directory);
                console.log(images_);
                setImages(images_);
              }
            } catch (error) {
              console.log(error);
            } finally {
              setLoading(false);
            }
          }}
        >
          Test BLIP
        </Button>
        <Button
          disabled={!directory}
          startDecorator={loading ? <CircularProgress /> : <FolderIcon />}
          onClick={async () => {
            setLoading(true);
            try {
              if (directory) {
                const content = await window.ipc.handleRunWd14(directory);
                console.log(content);
                const images_ = await window.ipc.showContent(directory);
                console.log(images_);
                setImages(images_);
              }
            } catch (error) {
              console.log(error);
            } finally {
              setLoading(false);
            }
          }}
        >
          Test WD14
        </Button>
        <Button
          disabled={!directory || !apiKey}
          startDecorator={loading ? <CircularProgress /> : <FolderIcon />}
          onClick={async () => {
            setLoading(true);
            try {
              if (directory) {
                const content = await window.ipc.handleRunGPTV(directory, {
                  exampleResponse,
                  systemMessage,
                  batchSize: 10,
                });
                console.log(content);
                const images_ = await window.ipc.showContent(directory);
                console.log(images_);
                setImages(images_);
              }
            } catch (error) {
              console.log(error);
            } finally {
              setLoading(false);
            }
          }}
        >
          Test GPT-V
        </Button>
        <IconButton
          onClick={async () => {
            setLoading(true);
            try {
              const directory_ = directory || (await window.ipc.selectFolder());
              if (directory_) {
                setDirectory(directory_);
                await window.ipc.store({
                  property: "directory",
                  value: directory_,
                });
                const content = await window.ipc.showContent(directory_);
                console.log(content);
                setImages(content);
              }
            } catch (error) {
              console.log(error);
            } finally {
              setLoading(false);
            }
          }}
        >
          <FolderIcon />
        </IconButton>
      </ButtonGroup>
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
              <Typography>{image.caption.join(", ")}</Typography>
            </Grid>
          );
        })}
      </Grid>
    </Layout>
  );
}
