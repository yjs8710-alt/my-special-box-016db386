const fetchLandSummary = async () => {
  try {
    const { data, error } = await supabase.functions.invoke("bright-processor", {
      body: {
        propertyId: property?.id,
        address: property?.address,
        pnu: property?.pnu,
      },
    });

    console.log("EDGE DATA:", data);
    console.log("EDGE ERROR:", error);

    if (error) {
      alert("Edge 호출 실패: " + error.message);
      return;
    }

    if (!data?.ok) {
      alert("응답 실패: " + (data?.error || "알 수 없는 오류"));
      return;
    }

    setLandSummary(data.data);
  } catch (e: any) {
    console.error("EDGE CATCH:", e);
    alert("요청 자체 실패: " + e.message);
  }
};
