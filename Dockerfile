FROM rocker/verse:4.6.1
WORKDIR /home/rstudio
RUN apt-get update -y && apt-get install -y rsync libarchive-dev

# Stage 1 of the R 4.6.1 upgrade: base image only.
# The old renv.lock was written for R 4.5.0, so it is not restored here.
# Stage 2: re-create renv.lock inside this image, then re-enable:
# RUN mkdir -p renv
# COPY renv.lock /home/rstudio/renv.lock
# COPY .Rprofile /home/rstudio/.Rprofile
# COPY renv/activate.R /home/rstudio/renv/activate.R
# COPY renv/settings.json /home/rstudio/renv/settings.json
# RUN R -e "renv::restore()"
