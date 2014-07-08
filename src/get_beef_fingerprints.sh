DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BEEF_DIR="${DIR}/../../beef"

echo "[+] Changing current working folder to local BeEF checkout";
cd $BEEF_DIR

echo "[+] Enumerating tags";
for BEEF_TAG in `git tag|cut -d" " -f 1`; do
	kill -9 $(ps aux | grep 'beef -x' | awk '{print $2}') &> /dev/null
	BEEF_PID=313373133
	echo "[+] Resetting configuration"
	git checkout config.yaml
	rm Gemfile.lock
	echo "[+] Setting up tags/${BEEF_TAG}..."
	git checkout tags/$BEEF_TAG
	bundle install
	echo "[+] Starting BeEF..."
	./beef -x &
	BEEF_PID=$!
	sleep 10
	echo "[+] Capturing method fingerprint..."
	casperjs $DIR/get_beef_fingerprint.js
	sleep 10
	echo "[+] Killing BeEF..."
	kill $BEEF_PID &> /dev/null
done

echo "[+] Stitching data...";
cd $DIR
node process_fingerprints.js
echo "[+] Done!";
