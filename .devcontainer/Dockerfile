# Minimal RedHat UBI base image
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:9.7-1767673763

USER root

# Enable Node.js 24 module and install basic tools
RUN microdnf install -y git tar gzip maven unzip gcc zlib-devel

# https://download.oracle.com/graalvm/25/latest/graalvm-jdk-25_linux-x64_bin.tar.gz
# https://github.com/graalvm/graalvm-ce-builds/releases/download/jdk-25.0.1/graalvm-community-jdk-25.0.1_linux-x64_bin.tar.gz


# ENV GRAALVM_VERSION=25.0.1 \
#     GRAALVM_CE_RELEASE=25.0.1 \
#     GRAALVM_HOME=/opt/graalvm

ENV GRAALVM_VERSION=25 \
    GRAALVM_CE_RELEASE=25.0.1 \
    GRAALVM_HOME=/opt/graalvm    

RUN ARCH="$(uname -m)" \
    && if [ "$ARCH" = "x86_64" ]; then \
         GRAALVM_ARCH="linux-x64"; \
       elif [ "$ARCH" = "aarch64" ]; then \
         GRAALVM_ARCH="linux-aarch64"; \
       else \
         echo "Unsupported architecture: $ARCH"; exit 1; \
       fi \
    && GRAALVM_DOWNLOAD_URL="https://download.oracle.com/graalvm/${GRAALVM_VERSION}/latest/graalvm-jdk-${GRAALVM_VERSION}_${GRAALVM_ARCH}_bin.tar.gz" \
    && echo $GRAALVM_DOWNLOAD_URL \
    && curl -L -o /tmp/graalvm.tar.gz $GRAALVM_DOWNLOAD_URL \
    && mkdir -p /opt \
    && tar xzf /tmp/graalvm.tar.gz -C /opt \
    && mv /opt/graalvm-* $GRAALVM_HOME \
    && rm /tmp/graalvm.tar.gz

ENV JAVA_HOME=$GRAALVM_HOME
ENV PATH="$JAVA_HOME/bin:$PATH"

# Only Binaryen (wasm-as) is strictly required for GraalVM WASM output
RUN ARCH="$(uname -m)" \
    && if [ "$ARCH" = "aarch64" ]; then \
         BINARYEN_VER="version_123"; \
         BINARYEN_ASSET="binaryen-${BINARYEN_VER}-aarch64-linux"; \
       elif [ "$ARCH" = "x86_64" ]; then \
         BINARYEN_VER="version_116"; \
         BINARYEN_ASSET="binaryen-${BINARYEN_VER}-x86_64-linux"; \
       else \
         echo "Unsupported architecture: $ARCH"; exit 1; \
       fi \
    && curl -L -o /tmp/binaryen.tgz "https://github.com/WebAssembly/binaryen/releases/download/${BINARYEN_VER}/${BINARYEN_ASSET}.tar.gz" \
    && mkdir -p /tmp/binaryen \
    && tar xzf /tmp/binaryen.tgz -C /tmp/binaryen --strip-components=1 \
    && mv /tmp/binaryen/bin/wasm-as /usr/local/bin/ \
    && rm -rf /tmp/binaryen*

EXPOSE 5173

RUN useradd -m -u 1000 appuser \
  && mkdir -p /workspace \
  && chown appuser:appuser /workspace \
  && mkdir -p /opt/app-root/src/.npm \
  && chown -R 1000:1000 /opt/app-root/src/.npm

# Set working directory
WORKDIR /workspace

# Switch to non-root user
USER appuser