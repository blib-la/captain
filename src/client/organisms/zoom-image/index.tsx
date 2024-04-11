import SearchOffIcon from "@mui/icons-material/SearchOff";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import Box from "@mui/joy/Box";
import ButtonGroup from "@mui/joy/ButtonGroup";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import { useTranslation } from "next-i18next";
import React from "react";
import {
	type ReactZoomPanPinchContentRef,
	TransformComponent,
	TransformWrapper,
} from "react-zoom-pan-pinch";

export function ZoomControls({ zoomIn, zoomOut, resetTransform }: ReactZoomPanPinchContentRef) {
	const { t } = useTranslation(["common"]);
	return (
		<Sheet variant="soft" sx={{ p: 0.5 }}>
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

export function ZoomImage({ image }: { image: string }) {
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
			{image && (
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
									<TransformComponent>
										<Box
											src={image}
											alt=""
											component="img"
											sx={{
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
