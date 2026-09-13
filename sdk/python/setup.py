from setuptools import setup, find_packages

setup(
    name="veritasai",
    version="1.0.0",
    description="Python SDK for VeritasAI — Cryptographic Evidence & Audit Platform for AI Agents",
    long_description=open("README.md", encoding="utf-8").read() if __import__("os").path.exists("README.md") else "",
    long_description_content_type="text/markdown",
    author="VeritasAI Engineering Team",
    author_email="team@veritasai.io",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[],  # Zero extra dependencies (uses built-in standard library)
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Topic :: Security :: Cryptography",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Programming Language :: Python :: 3",
    ],
)
