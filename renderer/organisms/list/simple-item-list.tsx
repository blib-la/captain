import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemContent from "@mui/joy/ListItemContent";
import Textarea from "@mui/joy/Textarea";
import { useEffect, useState } from "react";

interface Item {
	id: string;
	content: string;
}

interface SimpleItemListProperties {
	items: Item[];
	onAdd: (content: string) => void;
	onEdit: (id: string, content: string) => void;
	onDelete: (id: string) => void;
}
export function SimpleItemList({ items, onAdd, onEdit, onDelete }: SimpleItemListProperties) {
	const [editState, setEditState] = useState(items);
	const [newItemContent, setNewItemContent] = useState("");

	function handleEditConfirm(id: string) {
		const content = editState.find(item => item.id === id)?.content;
		onEdit(id, content ?? "");
	}

	function handleAddNewItem() {
		onAdd(newItemContent);
		setNewItemContent("");
	}

	useEffect(() => {
		setEditState(items);
	}, [items]);

	return (
		<Box>
			<List>
				<ListItem>
					<ListItemContent component="label">
						<Textarea
							placeholder="Add new item"
							value={newItemContent}
							size="sm"
							onChange={event => {
								setNewItemContent(event.target.value);
							}}
						/>
					</ListItemContent>
					<IconButton
						disabled={!newItemContent}
						aria-label="Add"
						size="sm"
						onClick={handleAddNewItem}
					>
						<AddIcon />
					</IconButton>
				</ListItem>
				{editState.map(item => (
					<ListItem key={item.id}>
						<ListItemContent component="label">
							<Textarea
								value={item.content}
								onBlur={() => {
									handleEditConfirm(item.id);
								}}
								onChange={event => {
									setEditState(previousValue =>
										previousValue.map(item_ =>
											item_.id === item.id
												? { ...item_, content: event.target.value }
												: item_
										)
									);
								}}
							/>
						</ListItemContent>
						<IconButton
							size="sm"
							color="danger"
							onClick={() => {
								onDelete(item.id);
							}}
						>
							<DeleteIcon />
						</IconButton>
					</ListItem>
				))}
			</List>
		</Box>
	);
}
