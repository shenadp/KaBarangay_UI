import json
import os
import urllib.request

SHA = "b6030a08d3b01859ded26b614446a0740a8ff213"
OUT = "Temp/res-ref"
tree = json.load(open("Temp/tree.json"))["tree"]
paths = {e["path"] for e in tree if e["type"] == "blob"}

wanted = sorted(
    p
    for p in paths
    if p.startswith("resources/js/pages/Resident/")
    or p.startswith("app/Http/Controllers/Resident/")
    or p.startswith("app/Http/Controllers/Concerns/")
    or p in {
        "app/Http/Controllers/ResidentSearchController.php",
        "app/Models/Announcement.php",
        "app/Models/AnnouncementAttendance.php",
        "app/Models/AnnouncementApprovalLog.php",
        "app/Models/ResidentInboxNotification.php",
        "app/Models/ResidentNotification.php",
        "app/Models/SectorApplication.php",
        "app/Models/LuponComplaint.php",
        "app/Models/LuponCase.php",
        "app/Models/DisbursementDocument.php",
        "app/Models/CitizenCharterVersion.php",
        "app/Models/CitizenCharterService.php",
        "app/Models/OrgChartPosition.php",
        "routes/web.php",
    }
)

os.makedirs(OUT, exist_ok=True)
for path in wanted:
    url = f"https://raw.githubusercontent.com/lewww123/KaBarangay/{SHA}/{path}"
    dest = os.path.join(OUT, path.replace("/", "__"))
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        continue
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            data = response.read()
        with open(dest, "wb") as handle:
            handle.write(data)
        print(f"ok {len(data):>7}  {path}")
    except Exception as error:  # noqa: BLE001
        print(f"FAIL {path} {error}")

print(f"--- {len(os.listdir(OUT))} files in {OUT}")
