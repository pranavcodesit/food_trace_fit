from setuptools import setup, find_packages

setup(
    name="foodscanner",
    version="0.1.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "Flask==2.2.5",
        "requests==2.31.0",
        "python-dotenv==0.21.1",
        "pandas==1.5.3",
        "numpy==1.24.3",
        "openpyxl==3.1.2",
        "groq==0.4.0",
        "Flask-Limiter==3.3.1",
        "Flask-Cors==3.0.10",
        "Flask-Talisman==1.1.0",
        "gunicorn==21.2.0",
        "waitress==2.1.2",
    ],
    python_requires=">=3.8",
)