from setuptools import setup, find_packages

install_requires = [
    'Flask>=3.1,<4',
    'kafka-python>=2.3,<3',
    'langchain>=1.2,<2',
    'langchain-community>=0.4,<1',
    'langchain-core>=1.4,<2',
    'langchain-mistralai>=1.1,<2',
    'langchain-openai>=1.2,<2',
    'langsmith>=0.8,<1',
    'openai>=2.36,<3',
    'pydantic>=2.13,<3',
    'python-dotenv>=1.2,<2',
    'jsonpickle>=4.1,<5',
    'numpy>=2.4,<3',
    'SQLAlchemy>=2.0,<3',
    'requests>=2.34,<3',
    'huggingface-hub>=1.14,<2',
    'tiktoken>=0.12,<1',
    'tokenizers>=0.23,<1',
]

setup(
    name='ds-service',
    version='1.0',
    packages=find_packages('src'),
    package_dir={'': 'src'},
    install_requires=install_requires,
    include_package_data=True,
    python_requires='>=3.12',
)