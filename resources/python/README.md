# Local setup

-   Install Python 3.10.11: https://www.python.org/downloads/release/python-31011/

```bash
# Create venv
python -m venv venv

# Install dependencies
pip install -r requirements.txt
```

# Testing

## Unit tests

```bash
cd .\resources\python
pytest
```

## Manual tests

```
cd .\resources
.\python-embedded\python.exe .\python\caption\wd14\main.py
```
