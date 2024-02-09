var lastResult = 0;
      var countResults = 0;
      var countScan = false;

      var html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: false,
      });
      html5QrcodeScanner.render(onScanSuccess);

      function convertTo24Hour(time12h) {
        const [time, modifier] = time12h.split(" ");

        let [hours, minutes, seconds] = time.split(":");

        if (hours === "12") {
          hours = "00";
        }

        if (modifier === "PM") {
          hours = parseInt(hours, 10) + 12;
        }

        return `${hours}:${minutes}:${seconds}`;
      }

      async function onScanSuccess(decodedText, decodedResult) {
        if (!countScan) {
          countScan = true;
          qrcodeReaderClose();
          beep();
          ++countResults;
          lastResult = decodedText;
          let temp = JSON.parse(localStorage.getItem("data_" + decodedText));
          let textContent = ``;
          if (temp) {
            if (temp["action"] == 0) {
              const responseDataInfo =
                await window.module.$api.user_config.getConfig(
                  `emp='${temp["number"]}'`
                );
              console.log(
                `กิจกรรม ${temp["acitivity"]} : สิ้นสุด ${decodedText}`
              );

              let cal_time =
                Math.abs(
                  Math.abs(new Date().getTime() - parseInt(temp["date"]))
                ) / 1000;

              let contentText = `ใช้เวลาไป ${
                Math.floor(parseInt(cal_time) / 60) > 0
                  ? Math.floor(parseInt(cal_time) / 60) + " นาที "
                  : ""
              }${parseInt(cal_time) % 60} วินาที`;
              textContent =
                `สิ้นสุดกิจกรรม ${temp["acitivity"]} \n` + contentText;

              if (responseDataInfo.data && responseDataInfo.data.length > 0) {
                const responseInsert =
                  await window.module.$api.user_config.postConfig(
                    {
                      emp: temp["number"],
                      index_ac: 7,
                      process_name: responseDataInfo["data"][0][3],
                      login:
                        new Date(parseInt(temp["date"]))
                          .toLocaleDateString()
                          .replaceAll("/", "-") +
                        " " +
                        convertTo24Hour(
                          new Date(parseInt(temp["date"])).toLocaleTimeString()
                        ),
                      logout:
                        new Date().toLocaleDateString().replaceAll("/", "-") +
                        " " +
                        convertTo24Hour(new Date().toLocaleTimeString()),
                      diff: cal_time,
                    },
                    "time_activity"
                  );
                if (
                  responseInsert.status === "successful" &&
                  responseInsert.data.length > 0
                ) {
                  localStorage.setItem(
                    `data_${decodedText}`,
                    JSON.stringify({
                      number: decodedText,
                      action: 1,
                    })
                  );
                }
              } else {
                Swal.fire({
                  position: "top-end",
                  icon: "error",
                  title: `เกิดข้อผิดพลาด`,
                  text: "ไม่พบข้อมูล",
                  showConfirmButton: false,
                  timer: 2000,
                });
                return 0;
              }
            } else {
              textContent = `กิจกรรม ${type_activity} : เริ่มกิจกรรม`;
              localStorage.setItem(
                `data_${decodedText}`,
                JSON.stringify({
                  number: decodedText,
                  action: 0,
                  date: new Date().getTime(),
                  acitivity: type_activity,
                })
              );
            }
          } else {
            textContent = `กิจกรรม ${type_activity} : เริ่มกิจกรรม`;

            localStorage.setItem(
              `data_${decodedText}`,
              JSON.stringify({
                number: decodedText,
                action: 0,
                date: new Date().getTime(),
                acitivity: type_activity,
              })
            );
          }

          const response = await window.module.$api.user_config.getConfig(
            `emp='${decodedText}'`
          );
          if (response.status == "successful" && response.data.length > 0) {

            Swal.fire({
              position: "top-end",
              icon: "success",
              title: `
              ชื่อ : ${response.data[0][5]} รหัส : ${decodedText} 
              model_name: ${response.data[0][1]}
              `,
              text: textContent,
              showConfirmButton: false,
              timer: 3000,
            });

            localStorage.setItem(
              decodedText,
              JSON.stringify({
                model_name: response.data[0][1],
                process_name: response.data[0][3],
                name: response.data[0][5],
              })
            );
          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: `เกิดข้อผิดพลาด`,
              text: "ไม่พบข้อมูล",
              showConfirmButton: false,
              timer: 2000,
            });
          }
        }
      }
      var runCamera = false;
      var type_activity = "";
      function qrcodeReaderOpen(type) {
        type_activity = type;
        runCamera = true;
        document.getElementById("qr-reader").style.top = "250px";
        try {
          document
            .getElementById("html5-qrcode-button-camera-permission")
            .click();
        } catch (error) {
          document.getElementById("html5-qrcode-button-camera-start").click();
        }
      }

      function qrcodeReaderClose() {
        runCamera = false;
        countScan = false;
        document.getElementById("qr-reader").style.top = "-1200dvh";
        document.getElementById("html5-qrcode-button-camera-stop").click();
      }

      function loadPermission() {
        if (!localStorage.getItem("HTML5_QRCODE_DATA")) {
          document
            .getElementById("html5-qrcode-button-camera-permission")
            .click();
          return false;
        }
        return true;
      }

      function beep() {
        var snd = new Audio(
          "data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU="
        );
        snd.play();
      }