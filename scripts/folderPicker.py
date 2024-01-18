import tkinter as tk
from tkinter import filedialog

def select_directory():
    root = tk.Tk()
    root.withdraw() # Hide the main window
    root.attributes('-topmost', True) # Make the dialog topmost
    folder_selected = filedialog.askdirectory()
    print(folder_selected)

select_directory()
