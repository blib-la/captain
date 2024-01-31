import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import Box from "@mui/joy/Box";
import ButtonGroup from "@mui/joy/ButtonGroup";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import { useAtom } from "jotai/index";
import { useTranslation } from "next-i18next";
import React from "react";
import {
	type ReactZoomPanPinchContentRef,
	TransformComponent,
	TransformWrapper,
} from "react-zoom-pan-pinch";

import { imagesAtom, selectedImageAtom } from "@/ions/atoms";

export function ZoomControls({ zoomIn, zoomOut, resetTransform }: ReactZoomPanPinchContentRef) {
	const { t } = useTranslation(["common"]);
	return (
		<Sheet sx={{ p: 0.5 }}>
			<ButtonGroup variant="soft" size="sm">
				<IconButton
					aria-label={t("common:zoomIn")}
					onClick={() => {
						zoomIn();
					}}
				>
					<ZoomInIcon />
				</IconButton>
				<IconButton
					aria-label={t("common:zoomOut")}
					onClick={() => {
						zoomOut();
					}}
				>
					<ZoomOutIcon />
				</IconButton>
				<IconButton
					aria-label={t("common:resetTransform")}
					onClick={() => {
						resetTransform();
					}}
				>
					<SearchOffIcon />
				</IconButton>
			</ButtonGroup>
		</Sheet>
	);
}

export function ZoomImageStage() {
	const [images] = useAtom(imagesAtom);
	const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
	const { t } = useTranslation(["common"]);
	return (
		<Box
			sx={{
				inset: 0,
				position: "absolute",
				overflow: "hidden",
				".react-transform-wrapper, .react-transform-component": {
					height: "100%",
					width: "100%",
				},
			}}
		>
			{images[selectedImage] && (
				<Box sx={{ position: "relative", height: "100%", width: "100%" }}>
					<TransformWrapper
						wheel={{
							step: 0.001,
							smoothStep: 0.001,
						}}
					>
						{utils => (
							<Box
								sx={{
									position: "absolute",
									inset: 0,
								}}
							>
								<ZoomControls {...utils} />
								<Box
									sx={{
										position: "absolute",
										top: 40,
										left: 0,
										right: 0,
										bottom: 0,
									}}
								>
									<IconButton
										variant="solid"
										aria-label={t("common:previous")}
										sx={{
											position: "absolute",
											top: "50%",
											left: 4,
											zIndex: 2,
											transform: "translateY(-50%)",
										}}
										onClick={() => {
											setSelectedImage(
												(images.length + selectedImage - 1) % images.length
											);
											utils.resetTransform();
										}}
									>
										<ChevronLeftIcon />
									</IconButton>
									<IconButton
										variant="solid"
										aria-label={t("common:next")}
										sx={{
											position: "absolute",
											top: "50%",
											right: 4,
											zIndex: 2,
											transform: "translateY(-50%)",
										}}
										onClick={() => {
											setSelectedImage((selectedImage + 1) % images.length);
											utils.resetTransform();
										}}
									>
										<ChevronRightIcon />
									</IconButton>
									<TransformComponent>
										<img
											src={`my://${images[selectedImage].image}`}
											alt=""
											style={{
												flex: 1,
												width: "100%",
												height: "100%",
												objectFit: "contain",
											}}
										/>
									</TransformComponent>
								</Box>
							</Box>
						)}
					</TransformWrapper>
				</Box>
			)}
		</Box>
	);
}
